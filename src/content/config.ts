import { defineCollection, z } from 'astro:content';

const sponsors = defineCollection({
  type: 'content',
  schema: z.object({
    name: z.string(),
    contact: z.string().optional(),
    tier: z.enum(['platinum', 'gold', 'silver', 'bronze', 'friend']),
    amount: z.number().optional(),
    website: z.string().url().optional(),
    logo: z.string().optional(),
    year: z.number().default(2025),
  }),
});

const news = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    date: z.string(),
    author: z.string().default('QV Boosters'),
    excerpt: z.string(),
    image: z.string().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { sponsors, news };
