import { prisma } from "../lib/db";
import { SEED_ARTICLES, SEED_EDITORS, SEED_VIDEOS } from "../lib/seed";
import { DEFAULT_SECTIONS } from "../lib/types";

async function main() {
  for (const s of DEFAULT_SECTIONS) {
    await prisma.section.upsert({
      where: { slug: s.slug },
      update: {},
      create: s,
    });
  }

  for (const e of SEED_EDITORS) {
    await prisma.editor.upsert({
      where: { id: e.id },
      update: {},
      create: { ...e, createdAt: new Date(e.createdAt) },
    });
  }

  for (const a of SEED_ARTICLES) {
    await prisma.article.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id,
        slug: a.slug,
        title: a.title,
        excerpt: a.excerpt,
        body: a.body,
        category: a.category,
        author: a.author,
        authorId: a.authorId,
        coAuthors: a.coAuthors ?? [],
        imageUrl: a.imageUrl,
        metaDescription: a.metaDescription,
        tags: a.tags,
        status: a.status,
        scheduledFor: a.scheduledFor ? new Date(a.scheduledFor) : undefined,
        deletedAt: a.deletedAt ? new Date(a.deletedAt) : undefined,
        isBreaking: a.isBreaking,
        isFeatured: a.isFeatured,
        isLiveBlog: a.isLiveBlog ?? false,
        rating: a.rating,
        views: a.views,
        publishedAt: new Date(a.publishedAt),
        updatedAt: new Date(a.updatedAt),
      },
    });
  }

  for (const v of SEED_VIDEOS) {
    await prisma.video.upsert({
      where: { id: v.id },
      update: {},
      create: {
        id: v.id,
        title: v.title,
        show: v.show,
        youtubeId: v.youtubeId,
        duration: v.duration,
        views: v.views,
        publishedAt: new Date(v.publishedAt),
        featured: v.featured ?? false,
      },
    });
  }

  console.log(
    `Seeded ${DEFAULT_SECTIONS.length} sections, ${SEED_EDITORS.length} editors, ${SEED_ARTICLES.length} articles, ${SEED_VIDEOS.length} videos.`
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
