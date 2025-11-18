import Handlebars from 'handlebars';

export interface NotificationData {
  title: string;
  content: string;
  summary?: string;
  url: string;
  author?: string;
  publishedAt?: Date;
  tags?: string[];
  source?: {
    name: string;
    type: string;
  };
  metadata?: Record<string, any>;
}

export interface TemplateContext {
  data: NotificationData;
  user?: {
    username: string;
    email: string;
  };
  rule?: {
    name: string;
    keywords: string[];
  };
  timestamp: string;
}

class NotificationTemplateService {
  private templates: Map<string, HandlebarsTemplateDelegate> = new Map();

  constructor() {
    this.initializeTemplates();
    this.registerHelpers();
  }

  /**
   * Register Handlebars helpers
   */
  private registerHelpers() {
    // Format date helper
    Handlebars.registerHelper('formatDate', (date: Date | string) => {
      if (!date) return 'N/A';
      const d = typeof date === 'string' ? new Date(date) : date;
      return d.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      });
    });

    // Truncate text helper
    Handlebars.registerHelper('truncate', (text: string, length: number) => {
      if (!text) return '';
      if (text.length <= length) return text;
      return text.substring(0, length) + '...';
    });

    // Join array helper
    Handlebars.registerHelper('join', (array: string[], separator: string) => {
      if (!Array.isArray(array)) return '';
      return array.join(separator || ', ');
    });
  }

  /**
   * Initialize default templates
   */
  private initializeTemplates() {
    // Email HTML template
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0; font-size: 24px; }
    .content { background: #fff; padding: 20px; border: 1px solid #e0e0e0; border-top: none; }
    .title { font-size: 20px; font-weight: bold; margin-bottom: 10px; color: #1a1a1a; }
    .meta { font-size: 14px; color: #666; margin-bottom: 15px; }
    .summary { font-size: 16px; color: #333; margin-bottom: 20px; line-height: 1.6; }
    .tags { margin: 15px 0; }
    .tag { display: inline-block; background: #f0f0f0; padding: 4px 12px; margin-right: 8px; margin-bottom: 8px; border-radius: 12px; font-size: 12px; color: #555; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; margin-top: 20px; }
    .footer { text-align: center; padding: 20px; font-size: 12px; color: #999; }
  </style>
</head>
<body>
  <div class="header">
    <h1>📬 新しい情報が収集されました</h1>
  </div>
  <div class="content">
    <div class="title">{{data.title}}</div>
    <div class="meta">
      {{#if data.author}}著者: {{data.author}} | {{/if}}
      {{#if data.publishedAt}}公開日: {{formatDate data.publishedAt}} | {{/if}}
      {{#if data.source}}ソース: {{data.source.name}}{{/if}}
    </div>
    <div class="summary">{{data.summary}}</div>
    {{#if data.tags}}
    <div class="tags">
      {{#each data.tags}}
      <span class="tag">{{this}}</span>
      {{/each}}
    </div>
    {{/if}}
    <a href="{{data.url}}" class="button">記事を読む →</a>
  </div>
  <div class="footer">
    <p>このメールは {{rule.name}} ルールによって送信されました</p>
    <p>Intelligent Alert Hub - {{timestamp}}</p>
  </div>
</body>
</html>
    `;

    // Email text template
    const emailText = `
新しい情報が収集されました

タイトル: {{data.title}}

{{#if data.author}}著者: {{data.author}}{{/if}}
{{#if data.publishedAt}}公開日: {{formatDate data.publishedAt}}{{/if}}
{{#if data.source}}ソース: {{data.source.name}} ({{data.source.type}}){{/if}}

概要:
{{data.summary}}

{{#if data.tags}}タグ: {{join data.tags ", "}}{{/if}}

詳細: {{data.url}}

---
このメールは {{rule.name}} ルールによって送信されました
Intelligent Alert Hub - {{timestamp}}
    `.trim();

    // Slack/Discord webhook template
    const webhook = `{
  "username": "Intelligent Alert Hub",
  "icon_emoji": ":bell:",
  "attachments": [
    {
      "color": "#667eea",
      "title": "{{data.title}}",
      "title_link": "{{data.url}}",
      "text": "{{truncate data.summary 200}}",
      "fields": [
        {{#if data.author}}
        {
          "title": "著者",
          "value": "{{data.author}}",
          "short": true
        },
        {{/if}}
        {{#if data.source}}
        {
          "title": "ソース",
          "value": "{{data.source.name}}",
          "short": true
        },
        {{/if}}
        {{#if data.tags}}
        {
          "title": "タグ",
          "value": "{{join data.tags ", "}}",
          "short": false
        }
        {{/if}}
      ],
      "footer": "{{rule.name}}",
      "ts": {{#if data.publishedAt}}{{data.publishedAt.getTime}}{{else}}Date.now(){{/if}}
    }
  ]
}`;

    // Web Push notification template
    const webPush = `{
  "title": "{{truncate data.title 50}}",
  "body": "{{truncate data.summary 100}}",
  "icon": "/icon-192.png",
  "badge": "/badge-72.png",
  "tag": "notification-{{data.url}}",
  "data": {
    "url": "{{data.url}}",
    "source": "{{data.source.name}}",
    "ruleId": "{{rule.name}}"
  },
  "actions": [
    {
      "action": "open",
      "title": "開く"
    },
    {
      "action": "close",
      "title": "閉じる"
    }
  ]
}`;

    // Compile templates
    this.templates.set('email-html', Handlebars.compile(emailHtml));
    this.templates.set('email-text', Handlebars.compile(emailText));
    this.templates.set('webhook', Handlebars.compile(webhook));
    this.templates.set('web-push', Handlebars.compile(webPush));
  }

  /**
   * Render a template with context
   */
  render(templateName: string, context: TemplateContext): string {
    const template = this.templates.get(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    return template(context);
  }

  /**
   * Register a custom template
   */
  registerTemplate(name: string, templateString: string) {
    this.templates.set(name, Handlebars.compile(templateString));
  }

  /**
   * Get available template names
   */
  getTemplateNames(): string[] {
    return Array.from(this.templates.keys());
  }
}

export const templateService = new NotificationTemplateService();
