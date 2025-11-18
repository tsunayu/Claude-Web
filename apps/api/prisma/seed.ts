import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (be careful in production!)
  console.log('🗑️  Cleaning existing data...');
  await prisma.notificationHistory.deleteMany();
  await prisma.collectedData.deleteMany();
  await prisma.notificationRule.deleteMany();
  await prisma.dataSource.deleteMany();
  await prisma.apiKey.deleteMany();
  await prisma.user.deleteMany();

  // Create demo users
  console.log('👤 Creating demo users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  const demoUser = await prisma.user.create({
    data: {
      email: 'demo@iah.example.com',
      username: 'demo',
      passwordHash,
      fullName: 'Demo User',
      emailVerified: true,
      subscriptionTier: 'pro',
      timezone: 'Asia/Tokyo',
      language: 'ja',
    },
  });

  const johnDoe = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'johndoe',
      passwordHash,
      fullName: 'John Doe',
      emailVerified: true,
      subscriptionTier: 'free',
      timezone: 'America/New_York',
      language: 'en',
    },
  });

  console.log(`✅ Created users: ${demoUser.username}, ${johnDoe.username}`);

  // Create data sources
  console.log('📡 Creating data sources...');

  const rssSource = await prisma.dataSource.create({
    data: {
      userId: demoUser.id,
      name: 'TechCrunch RSS',
      type: 'rss',
      config: {
        url: 'https://techcrunch.com/feed/',
        category: 'technology',
      },
      isActive: true,
      checkInterval: 300, // 5 minutes
    },
  });

  const hackerNewsSource = await prisma.dataSource.create({
    data: {
      userId: demoUser.id,
      name: 'Hacker News',
      type: 'web',
      config: {
        url: 'https://news.ycombinator.com/',
        selector: '.storylink',
      },
      isActive: true,
      checkInterval: 600, // 10 minutes
    },
  });

  const twitterSource = await prisma.dataSource.create({
    data: {
      userId: demoUser.id,
      name: 'Tech Twitter',
      type: 'twitter',
      config: {
        accounts: ['@vercel', '@github', '@openai'],
        keywords: ['AI', 'Machine Learning', 'Web Development'],
      },
      isActive: false, // Disabled by default (requires API keys)
      checkInterval: 300,
    },
  });

  const newsApiSource = await prisma.dataSource.create({
    data: {
      userId: johnDoe.id,
      name: 'Business News',
      type: 'news_api',
      config: {
        apiKey: 'demo-api-key',
        category: 'business',
        country: 'us',
      },
      isActive: true,
      checkInterval: 900, // 15 minutes
    },
  });

  console.log(`✅ Created ${4} data sources`);

  // Create notification rules
  console.log('🔔 Creating notification rules...');

  const aiNewsRule = await prisma.notificationRule.create({
    data: {
      userId: demoUser.id,
      name: 'AI & Machine Learning News',
      description: 'Get notified about AI and ML developments',
      keywords: ['AI', 'Artificial Intelligence', 'Machine Learning', 'GPT', 'LLM'],
      excludeKeywords: ['crypto', 'bitcoin'],
      sourceTypes: ['rss', 'web', 'news_api'],
      priority: 5,
      channels: {
        email: { enabled: true, address: demoUser.email },
        push: { enabled: false },
        webhook: { enabled: false },
        desktop: { enabled: true },
      },
      batchEnabled: false,
      isActive: true,
    },
  });

  const breakingNewsRule = await prisma.notificationRule.create({
    data: {
      userId: demoUser.id,
      name: 'Breaking Tech News',
      description: 'Important breaking news in technology',
      keywords: ['Breaking', 'Announced', 'Launched', 'Released'],
      excludeKeywords: [],
      sourceTypes: ['rss', 'twitter'],
      priority: 10,
      channels: {
        email: { enabled: true, address: demoUser.email },
        push: { enabled: true },
        webhook: { enabled: false },
        desktop: { enabled: true },
      },
      quietHours: {
        enabled: true,
        start: '22:00',
        end: '07:00',
        timezone: 'Asia/Tokyo',
      },
      batchEnabled: false,
      isActive: true,
    },
  });

  const digestRule = await prisma.notificationRule.create({
    data: {
      userId: johnDoe.id,
      name: 'Daily Business Digest',
      description: 'Daily digest of business news',
      keywords: ['business', 'market', 'economy', 'startup'],
      excludeKeywords: [],
      sourceTypes: ['news_api'],
      priority: 3,
      channels: {
        email: { enabled: true, address: johnDoe.email },
        push: { enabled: false },
        webhook: { enabled: false },
        desktop: { enabled: false },
      },
      batchEnabled: true,
      batchInterval: 1440, // 24 hours (daily)
      maxPerBatch: 20,
      isActive: true,
    },
  });

  console.log(`✅ Created ${3} notification rules`);

  // Create sample collected data
  console.log('📰 Creating sample collected data...');

  const sampleData1 = await prisma.collectedData.create({
    data: {
      dataSourceId: rssSource.id,
      title: 'OpenAI Announces GPT-5 with Breakthrough Performance',
      content:
        'OpenAI has announced GPT-5, the latest iteration of their large language model, featuring significant improvements in reasoning and multimodal capabilities...',
      summary:
        'OpenAI releases GPT-5 with major improvements in AI capabilities and performance.',
      url: 'https://techcrunch.com/2025/01/15/openai-gpt5-announcement',
      author: 'TechCrunch Staff',
      publishedAt: new Date('2025-01-15T10:00:00Z'),
      language: 'en',
      tags: ['AI', 'GPT', 'OpenAI', 'Machine Learning'],
      categories: ['Technology', 'Artificial Intelligence'],
      keywords: ['GPT-5', 'OpenAI', 'AI', 'LLM'],
      sentiment: 0.8,
      isProcessed: true,
      notified: false,
    },
  });

  const sampleData2 = await prisma.collectedData.create({
    data: {
      dataSourceId: hackerNewsSource.id,
      title: 'Show HN: I built a real-time collaborative coding platform',
      content:
        'After 6 months of development, I am excited to share my real-time collaborative coding platform built with WebSockets and CRDT...',
      summary: 'Developer shares new real-time collaborative coding platform on Hacker News.',
      url: 'https://news.ycombinator.com/item?id=123456',
      author: 'hn_user',
      publishedAt: new Date('2025-01-15T14:30:00Z'),
      language: 'en',
      tags: ['Show HN', 'Coding', 'Collaboration'],
      categories: ['Development', 'Tools'],
      keywords: ['collaborative', 'coding', 'WebSockets', 'CRDT'],
      sentiment: 0.6,
      isProcessed: true,
      notified: false,
    },
  });

  const sampleData3 = await prisma.collectedData.create({
    data: {
      dataSourceId: rssSource.id,
      title: 'Breaking: Major Tech Company Announces Layoffs',
      content:
        'In a surprising move, the tech giant announced today that it will be laying off 10% of its workforce...',
      summary: 'Tech company announces significant workforce reduction.',
      url: 'https://techcrunch.com/2025/01/15/tech-layoffs-announcement',
      author: 'Business Desk',
      publishedAt: new Date('2025-01-15T16:00:00Z'),
      language: 'en',
      tags: ['Breaking', 'Layoffs', 'Tech Industry'],
      categories: ['Business', 'Technology'],
      keywords: ['layoffs', 'tech', 'workforce'],
      sentiment: -0.5,
      isProcessed: true,
      notified: false,
    },
  });

  const sampleData4 = await prisma.collectedData.create({
    data: {
      dataSourceId: newsApiSource.id,
      title: 'Stock Market Reaches New Heights',
      content:
        'The stock market closed at record highs today, driven by strong earnings reports from major tech companies...',
      summary: 'Stock market hits all-time high with strong tech earnings.',
      url: 'https://newsapi.org/article/stock-market-highs',
      author: 'Financial Times',
      publishedAt: new Date('2025-01-15T20:00:00Z'),
      language: 'en',
      tags: ['Stock Market', 'Finance', 'Economy'],
      categories: ['Business', 'Finance'],
      keywords: ['stock', 'market', 'earnings', 'tech'],
      sentiment: 0.7,
      isProcessed: true,
      notified: false,
    },
  });

  console.log(`✅ Created ${4} sample collected data entries`);

  // Create sample notification history
  console.log('📬 Creating sample notification history...');

  await prisma.notificationHistory.create({
    data: {
      userId: demoUser.id,
      notificationRuleId: aiNewsRule.id,
      collectedDataId: sampleData1.id,
      channel: 'email',
      status: 'sent',
      recipient: demoUser.email,
      subject: 'AI News Alert: OpenAI Announces GPT-5 with Breakthrough Performance',
      message: 'OpenAI releases GPT-5 with major improvements in AI capabilities and performance.',
      sentAt: new Date(),
    },
  });

  await prisma.notificationHistory.create({
    data: {
      userId: demoUser.id,
      notificationRuleId: breakingNewsRule.id,
      collectedDataId: sampleData3.id,
      channel: 'desktop',
      status: 'sent',
      recipient: 'desktop-client',
      subject: 'Breaking News: Major Tech Company Announces Layoffs',
      message: 'Tech company announces significant workforce reduction.',
      sentAt: new Date(),
      readAt: new Date(),
    },
  });

  await prisma.notificationHistory.create({
    data: {
      userId: demoUser.id,
      notificationRuleId: aiNewsRule.id,
      collectedDataId: sampleData2.id,
      channel: 'email',
      status: 'pending',
      recipient: demoUser.email,
      subject: 'New collaborative coding platform on Hacker News',
      message: 'Developer shares new real-time collaborative coding platform on Hacker News.',
    },
  });

  console.log(`✅ Created ${3} notification history entries`);

  // Create API keys
  console.log('🔑 Creating API keys...');

  await prisma.apiKey.create({
    data: {
      userId: demoUser.id,
      keyHash: await bcrypt.hash('demo-api-key-12345', 10),
      name: 'Development API Key',
      permissions: {
        read: true,
        write: true,
        delete: false,
      },
      isActive: true,
    },
  });

  console.log(`✅ Created API keys`);

  // Print summary
  console.log('\n📊 Seed Summary:');
  console.log('================');
  console.log(`👤 Users: ${await prisma.user.count()}`);
  console.log(`📡 Data Sources: ${await prisma.dataSource.count()}`);
  console.log(`🔔 Notification Rules: ${await prisma.notificationRule.count()}`);
  console.log(`📰 Collected Data: ${await prisma.collectedData.count()}`);
  console.log(`📬 Notification History: ${await prisma.notificationHistory.count()}`);
  console.log(`🔑 API Keys: ${await prisma.apiKey.count()}`);
  console.log('\n✅ Database seeded successfully!');
  console.log('\n📝 Demo Credentials:');
  console.log('   Email: demo@iah.example.com');
  console.log('   Password: password123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
