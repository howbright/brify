export type BlogPost = {
  slug: string;
  title: string;
  excerpt: string;
  image: string;
  content?: string[];
  markdown?: string;
  middleImage?: {
    src: string;
    alt: string;
    caption?: string;
    afterParagraph?: number;
  };
};
