// Fixed backend/utils/claude.js - Replace your current file with this

import Anthropic from '@anthropic-ai/sdk';

class ClaudeAnalyzer {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.retryCount = 2;
    this.fallbackActive = false; // Initialize properly
    
    // Add debug logging
    console.log('ClaudeAnalyzer initialized:', {
      hasApiKey: !!process.env.CLAUDE_API_KEY,
      keyPrefix: process.env.CLAUDE_API_KEY ? process.env.CLAUDE_API_KEY.substring(0, 10) + '...' : 'Missing'
    });
  }

  async analyzeSubmission(submission, documentContent) {
    console.log('analyzeSubmission called, fallbackActive:', this.fallbackActive);
    
    // Check if we have API key
    if (!process.env.CLAUDE_API_KEY) {
      console.warn('No Claude API key found, using local fallback');
      return this.enhancedLocalFallback(submission);
    }

    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        console.log(`Claude API attempt ${attempt}/${this.retryCount}`);

        // REMOVED PROBLEMATIC CIRCUIT BREAKER LOGIC
        // The random circuit breaker was preventing API calls

        const prompt = this.buildEnhancedPrompt(submission, documentContent);
        
        console.log('Making Claude API call...');
        const response = await this.client.messages.create({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 2000,
          temperature: 0.2,
          messages: [{ role: 'user', content: prompt }]
        });

        console.log('Claude API call successful!');
        const analysis = this.parseResponse(response.content[0].text);
        this.fallbackActive = false; // Reset on success
        
        return {
          ...analysis,
          source: 'claude',
          enhanced: true
        };

      } catch (error) {
        console.error(`Claude API attempt ${attempt} failed:`, {
          message: error.message,
          status: error.status,
          type: error.constructor.name
        });

        // Handle rate limiting
        if (error.status === 429) {
          console.log(`Rate limited, waiting ${1000 * attempt * 2}ms...`);
          await this.sleep(1000 * attempt * 2);
        } 
        // Handle server errors
        else if (error.status >= 500) {
          console.log('Server error detected, will use fallback after retries');
          this.fallbackActive = true;
        }
        // Handle auth errors (don't retry these)
        else if (error.status === 401 || error.status === 403) {
          console.error('Authentication error - check API key');
          break; // Don't retry auth errors
        }

        // If this was the last attempt, use fallback
        if (attempt === this.retryCount) {
          console.warn('All Claude API attempts failed, using enhanced local fallback');
          return this.enhancedLocalFallback(submission);
        }
      }
    }

    // Fallback if all attempts failed
    return this.enhancedLocalFallback(submission);
  }

  buildEnhancedPrompt(submission, documentContent) {
    const truncatedDoc = documentContent ? documentContent.slice(0, 3000) : 'No document content provided';
    
    return `You are an expert regulatory writing instructor with 15+ years of experience training financial services professionals. Analyze this student's regulatory newsflash submission with honesty and specific, professional and actionable feedback.

REGULATORY DOCUMENT EXCERPT:
${truncatedDoc}

STUDENT SUBMISSION:
Executive Summary (${submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length} words): "${submission.summary}"

Impact Analysis: "${submission.impacts}"

Document Structure: "${submission.structure}"

EVALUATION CRITERIA:
1. Content Quality: Is this coherent, professional writing that demonstrates understanding?
2. Summary Length: Should be 30-100 words, appropriately detailed
3. Business Focus: Does it identify specific client impacts (costs, timelines, risks)?
4. Regulatory Understanding: Shows grasp of compliance requirements?
5. Professional Language: Appropriate tone for executive audience?

CRITICAL ASSESSMENT REQUIRED:
- If content is nonsensical, gibberish, or placeholder text, score very low (0-20) and be explicit about quality issues
- If content is coherent but basic, provide specific improvement guidance
- If content is strong, identify what makes it effective

Respond in this EXACT JSON format:
{
  "score": [0-100 integer],
  "feedback": {
    "items": [
      {"type": "good|warning|error", "text": "Specific observation about their work"},
      {"type": "good|warning|error", "text": "Another specific point"}
    ],
    "improvements": [
      "Specific actionable improvement #1",
      "Specific actionable improvement #2",
      "Specific actionable improvement #3"
    ]
  }
}

Be specific, professional, honest, and educational. If the work is poor quality, say so clearly and explain why.`;
  }

  parseResponse(responseText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        
        // Validate the response structure
        if (parsed.score !== undefined && parsed.feedback && parsed.feedback.items) {
          return parsed;
        }
      }
      
      // Fallback parsing if JSON is malformed
      return this.extractFeedbackFromText(responseText);
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      return this.createBasicFeedback(responseText);
    }
  }

  extractFeedbackFromText(text) {
    // More sophisticated text parsing for non-JSON responses
    const lines = text.split('\n').filter(line => line.trim());
    
    // Try to extract score
    const scoreMatch = text.match(/score[:\s]*(\d+)/i);
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    return {
      score: Math.min(Math.max(score, 0), 100),
      feedback: {
        items: [
          { type: 'info', text: 'Claude provided detailed analysis - check logs for full response' }
        ],
        improvements: [
          'Review the specific feedback provided',
          'Focus on professional language and structure',
          'Ensure content demonstrates regulatory understanding'
        ]
      }
    };
  }

  enhancedLocalFallback(submission) {
    console.log('Using enhanced local analysis fallback');
    
    let score = 0;
    const feedback = { items: [], improvements: [] };

    // Enhanced analysis similar to frontend
    const summaryWords = submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    const summaryText = submission.summary.toLowerCase();
    
    // Check for nonsensical content
    const isNonsensical = /^[a-z\s]{1,10}$|(.)\1{3,}|^[^a-z]*$/i.test(submission.summary.trim());
    
    if (isNonsensical) {
      feedback.items.push({
        type: 'error',
        text: 'Content appears fragmented or insufficient. Please provide coherent regulatory analysis.'
      });
      score = 10;
    } else if (summaryWords >= 30 && summaryWords <= 100) {
      score += 35;
      feedback.items.push({
        type: 'good',
        text: `Professional summary length (${summaryWords} words)`
      });
    } else {
      score += Math.max(5, summaryWords);
      feedback.items.push({
        type: 'warning',
        text: `Summary length needs adjustment (${summaryWords} words, need 30-100)`
      });
    }

    // Analyze impact quality
    if (submission.impacts.length > 100) {
      score += 30;
      feedback.items.push({
        type: 'good',
        text: 'Comprehensive impact analysis'
      });
    } else {
      score += 15;
      feedback.improvements.push('Expand impact analysis with specific business implications');
    }

    // Analyze structure
    if (submission.structure.length > 50) {
      score += 25;
    } else {
      feedback.improvements.push('Provide more detailed document structure outline');
    }

    // Add general improvements
    if (score < 50) {
      feedback.improvements.unshift('Focus on coherent, professional regulatory content');
    }

    return {
      score: Math.min(score, 100),
      feedback,
      source: 'local',
      enhanced: true,
      message: 'Enhanced local analysis provided. Claude AI will provide more detailed feedback when available.'
    };
  }

  createBasicFeedback(originalResponse) {
    return {
      score: 40,
      feedback: {
        items: [
          { type: 'warning', text: 'AI analysis encountered technical issues' }
        ],
        improvements: [
          'Ensure summary is 30-100 words with specific regulatory details',
          'Include quantified business impacts and timelines',
          'Provide clear document structure with section headers'
        ]
      },
      rawResponse: originalResponse
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ClaudeAnalyzer();