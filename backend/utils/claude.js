import Anthropic from '@anthropic-ai/sdk';

class ClaudeAnalyzer {
  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.CLAUDE_API_KEY
    });
    this.retryCount = 3;
    this.fallbackActive = false;
  }

  async analyzeSubmission(submission, documentContent) {
    for (let attempt = 1; attempt <= this.retryCount; attempt++) {
      try {
        if (this.fallbackActive && Math.random() > 0.1) {
          throw new Error('Circuit breaker active');
        }

        const prompt = this.buildPrompt(submission, documentContent);
        
        const response = await this.client.messages.create({
          model: 'claude-3-sonnet-20240229',
          max_tokens: 1500,
          messages: [{ role: 'user', content: prompt }]
        });

        const analysis = this.parseResponse(response.content[0].text);
        this.fallbackActive = false; // Success - reset circuit breaker
        
        return {
          ...analysis,
          source: 'claude',
          enhanced: true
        };

      } catch (error) {
        console.error(`Claude API attempt ${attempt} failed:`, error.message);

        if (error.status === 429) {
          // Rate limited - wait and retry
          await this.sleep(1000 * attempt * 2);
        } else if (error.status >= 500) {
          // Server error - activate circuit breaker
          this.fallbackActive = true;
        }

        if (attempt === this.retryCount) {
          console.warn('All Claude API attempts failed, using local fallback');
          return this.localFallback(submission);
        }
      }
    }
  }

  buildPrompt(submission, documentContent) {
    // Truncate document to save tokens
    const truncatedDoc = documentContent.slice(0, 2000);
    
    return `You are an expert regulatory writing instructor. Analyze this student's newsflash submission and provide structured feedback.

REGULATORY DOCUMENT EXCERPT:
${truncatedDoc}...

STUDENT SUBMISSION:
Executive Summary: ${submission.summary}
Impact Analysis: ${submission.impacts}
Document Structure: ${submission.structure}

Please provide your response in this exact JSON format:
{
  "score": 85,
  "feedback": {
    "items": [
      {"type": "good", "text": "Excellent summary length and clarity"},
      {"type": "warning", "text": "Consider adding more specific cost implications"},
      {"type": "error", "text": "Missing key compliance requirements"}
    ],
    "improvements": [
      "Add specific timeline for implementation requirements",
      "Include estimated financial impact figures",
      "Structure with clear section headers for better readability"
    ]
  }
}

Focus on: clarity, business impact identification, client perspective, and document structure. Score out of 100.`;
  }

  parseResponse(responseText) {
    try {
      // Try to extract JSON from response
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      
      // Fallback parsing if no JSON found
      return this.extractFeedbackFromText(responseText);
    } catch (error) {
      console.error('Failed to parse Claude response:', error);
      return this.createBasicFeedback(responseText);
    }
  }

  extractFeedbackFromText(text) {
    // Basic text parsing fallback
    const lines = text.split('\n').filter(line => line.trim());
    
    return {
      score: 75, // Default score
      feedback: {
        items: [
          { type: 'good', text: 'AI analysis completed successfully' }
        ],
        improvements: [
          'Review the detailed feedback provided',
          'Focus on clarity and business impact'
        ]
      }
    };
  }

  createBasicFeedback(originalResponse) {
    return {
      score: 70,
      feedback: {
        items: [
          { type: 'warning', text: 'AI analysis partially completed' }
        ],
        improvements: [
          'Ensure executive summary is 30-100 words',
          'Focus on specific business impacts',
          'Use clear document structure'
        ]
      },
      rawResponse: originalResponse
    };
  }

  localFallback(submission) {
    console.log('Using local analysis fallback');
    
    let score = 0;
    const feedback = { items: [], improvements: [] };

    // Analyze summary length
    const summaryWords = submission.summary.trim().split(/\s+/).filter(w => w.length > 0).length;
    if (summaryWords >= 30 && summaryWords <= 100) {
      score += 30;
      feedback.items.push({ 
        type: 'good', 
        text: `Good summary length (${summaryWords} words)` 
      });
    } else {
      feedback.items.push({ 
        type: 'warning', 
        text: `Summary should be 30-100 words (currently ${summaryWords})` 
      });
      feedback.improvements.push('Adjust summary length to 30-100 words');
    }

    // Analyze impact keywords
    const impactText = submission.impacts.toLowerCase();
    const keywords = ['cost', 'compliance', 'risk', 'implementation', 'deadline'];
    const foundKeywords = keywords.filter(k => impactText.includes(k));
    
    if (foundKeywords.length >= 3) {
      score += 40;
      feedback.items.push({ 
        type: 'good', 
        text: `Good impact analysis covering ${foundKeywords.length} key areas` 
      });
    } else {
      feedback.items.push({ 
        type: 'warning', 
        text: 'Consider adding more impact categories (costs, risks, timeline)' 
      });
      feedback.improvements.push('Include financial, operational, and compliance impacts');
    }

    // Analyze structure
    const structureText = submission.structure.toLowerCase();
    if (structureText.includes('summary') || structureText.includes('executive')) {
      score += 30;
      feedback.items.push({ 
        type: 'good', 
        text: 'Good document structure with executive summary' 
      });
    } else {
      feedback.improvements.push('Start with an executive summary section');
    }

    return {
      score: Math.min(score, 100),
      feedback,
      source: 'local',
      enhanced: false,
      message: 'Local analysis provided. Enhanced AI feedback will be available when service resumes.'
    };
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default new ClaudeAnalyzer();