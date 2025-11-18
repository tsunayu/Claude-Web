import { templateService, NotificationData, TemplateContext } from '../template.service';

describe('TemplateService', () => {
  const mockData: NotificationData = {
    title: 'Test Article',
    content: 'This is a test article content.',
    summary: 'Test summary',
    url: 'https://example.com/test',
    author: 'John Doe',
    publishedAt: new Date('2024-01-01T00:00:00Z'),
    tags: ['test', 'example'],
    source: {
      name: 'Test Source',
      type: 'rss',
    },
  };

  const mockContext: TemplateContext = {
    data: mockData,
    timestamp: '2024-01-01T00:00:00Z',
    rule: {
      name: 'Test Rule',
      keywords: ['test'],
    },
  };

  describe('render', () => {
    it('should render email-html template', () => {
      const result = templateService.render('email-html', mockContext);

      expect(result).toContain('Test Article');
      expect(result).toContain('Test summary');
      expect(result).toContain('John Doe');
      expect(result).toContain('https://example.com/test');
      expect(result).toContain('Test Rule');
    });

    it('should render email-text template', () => {
      const result = templateService.render('email-text', mockContext);

      expect(result).toContain('Test Article');
      expect(result).toContain('Test summary');
      expect(result).toContain('John Doe');
      expect(result).toContain('https://example.com/test');
    });

    it('should render webhook template', () => {
      const result = templateService.render('webhook', mockContext);
      const parsed = JSON.parse(result);

      expect(parsed.attachments).toBeDefined();
      expect(parsed.attachments[0].title).toBe('Test Article');
    });

    it('should throw error for non-existent template', () => {
      expect(() => {
        templateService.render('non-existent', mockContext);
      }).toThrow('Template not found: non-existent');
    });
  });

  describe('registerTemplate', () => {
    it('should register and render custom template', () => {
      const customTemplate = 'Hello {{data.title}}!';
      templateService.registerTemplate('custom', customTemplate);

      const result = templateService.render('custom', mockContext);
      expect(result).toBe('Hello Test Article!');
    });
  });

  describe('getTemplateNames', () => {
    it('should return all registered template names', () => {
      const names = templateService.getTemplateNames();

      expect(names).toContain('email-html');
      expect(names).toContain('email-text');
      expect(names).toContain('webhook');
      expect(names).toContain('web-push');
    });
  });

  describe('Handlebars helpers', () => {
    it('should truncate text correctly', () => {
      const longText = 'a'.repeat(150);
      const context: TemplateContext = {
        data: { ...mockData, summary: longText },
        timestamp: '2024-01-01T00:00:00Z',
      };

      templateService.registerTemplate('truncate-test', '{{truncate data.summary 50}}');
      const result = templateService.render('truncate-test', context);

      expect(result.length).toBeLessThanOrEqual(53); // 50 + '...'
    });

    it('should join array correctly', () => {
      templateService.registerTemplate('join-test', '{{join data.tags ", "}}');
      const result = templateService.render('join-test', mockContext);

      expect(result).toBe('test, example');
    });

    it('should format date correctly', () => {
      templateService.registerTemplate('date-test', '{{formatDate data.publishedAt}}');
      const result = templateService.render('date-test', mockContext);

      expect(result).toMatch(/2024/);
    });
  });
});
