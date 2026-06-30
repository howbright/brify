import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const root = process.cwd();

function loadEnvFile(fileName) {
  const filePath = path.join(root, fileName);
  if (!fs.existsSync(filePath)) return {};
  return Object.fromEntries(
    fs
      .readFileSync(filePath, "utf8")
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#") && line.includes("="))
      .map((line) => {
        const index = line.indexOf("=");
        return [
          line.slice(0, index).trim(),
          line.slice(index + 1).trim().replace(/^['"]|['"]$/g, ""),
        ];
      })
  );
}

const env = { ...loadEnvFile(".env"), ...loadEnvFile(".env.local"), ...process.env };
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const imageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/en/1781139691915-2a845d34-3b57-448b-a7b8-6626b7c23d2b-4.001.jpeg";
const bodyImageUrl =
  "https://ojtkmpiiquwgetwyoyqy.supabase.co/storage/v1/object/public/blog-images/ko/1780975282822-6cc628f6-a35f-47be-b13e-9bdfa6de3045-2026-06-09-12.20.23.png";
const bodyImageMarkdown = `![blog image](${bodyImageUrl})`;

function insertDefaultBodyImage(markdown) {
  const cleanMarkdown = markdown.trim();
  if (cleanMarkdown.includes(bodyImageUrl)) return cleanMarkdown;
  const lines = cleanMarkdown.split(/\r?\n/);
  const headings = lines
    .map((line, index) => (/^##\s+/.test(line.trim()) ? index : -1))
    .filter((index) => index > 0);
  const midpoint = Math.floor(lines.length / 2);
  const insertIndex =
    headings.find((index) => index >= midpoint) ?? headings[Math.floor(headings.length / 2)] ?? lines.length;
  lines.splice(insertIndex, 0, "", bodyImageMarkdown, "");
  return lines.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [
      `## ${section.heading}`,
      ...section.paragraphs,
    ].join("\n\n")),
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

function makePost({
  koSlug,
  slug,
  title,
  excerpt,
  keywords,
  intro,
  headings,
  finalAngle,
}) {
  return {
    koSlug,
    slug,
    title,
    excerpt,
    seo_keywords: [...keywords, "carte de structure", "résumé IA", "Brify"],
    intro,
    sections: headings.map((heading, index) => ({
      heading,
      paragraphs: [
        index === 0
          ? "Le plus important est de ne pas confondre vitesse et compréhension. Un bon résumé doit garder visibles la question de recherche, la méthode, les résultats et les limites."
          : "En isolant ce point, vous évitez de transformer l'article en une suite de phrases jolies mais difficiles à réutiliser. La note devient plus claire pour un rapport, une présentation ou une revue de littérature.",
        index === headings.length - 1
          ? "Brify aide à transformer l'article en carte modifiable. Vous pouvez vérifier la logique de l'étude, déplacer les idées importantes et revenir plus facilement à la source."
          : "Cette étape permet aussi de repérer ce qui manque dans un résumé automatique: les conditions de l'étude, les choix méthodologiques, les nuances et les limites.",
      ],
    })),
    closing: finalAngle,
  };
}

const posts = [
  {
    koSlug: "how-to-organize-research-paper",
    slug: "comment-organiser-un-article-scientifique",
    title: "Comment organiser un article scientifique avant de le résumer",
    excerpt:
      "Une méthode simple pour organiser un article scientifique par question, méthode, résultats et limites avant d'en faire un résumé utile.",
    seo_keywords: [
      "organiser un article scientifique",
      "résumé article scientifique",
      "comment résumer un article scientifique",
      "outil IA article scientifique",
      "lecture d'article académique",
      "Brify",
    ],
    intro:
      "La première erreur, quand on lit un article scientifique, est souvent de commencer par surligner. Le surlignage peut aider, mais organiser un article commence surtout par comprendre sa logique.",
    sections: [
      {
        heading: "Pourquoi les articles scientifiques sont difficiles à organiser",
        paragraphs: [
          "Un article mélange généralement problème, travaux antérieurs, méthode, résultats, discussion et limites. Ces éléments sont liés, mais ils ne sont pas toujours faciles à suivre à la première lecture.",
          "Si chaque phrase paraît aussi importante que les autres, la lecture devient vite une collection de notes. Pour obtenir un résumé utile, il faut d'abord séparer les parties de l'argument.",
        ],
      },
      {
        heading: "Les cinq éléments à repérer en premier",
        paragraphs: [
          "Avant de rédiger un résumé, identifiez la question de recherche, les données ou le corpus, la méthode, les résultats principaux et les limites.",
          "Ces éléments forment une carte de l'article. Une fois cette carte visible, les détails deviennent plus faciles à replacer.",
        ],
      },
      {
        heading: "Pourquoi le résumé de l'article ne suffit pas",
        paragraphs: [
          "L'abstract est utile pour entrer dans le sujet, mais il compresse fortement l'étude. Il laisse souvent de côté les conditions, les limites et les choix méthodologiques.",
          "Si vous devez citer l'article, l'utiliser dans un mémoire ou préparer une présentation, vous avez besoin de plus qu'un paragraphe court.",
        ],
      },
      {
        heading: "Relier question, méthode et résultats",
        paragraphs: [
          "Un article devient plus clair lorsque vous reliez ce qu'il cherche à savoir, la manière dont il le vérifie et ce que les résultats permettent réellement d'affirmer.",
          "Ce lien transforme le résumé en note de recherche réutilisable, au lieu d'un simple raccourci.",
        ],
      },
      {
        heading: "Ce que Brify apporte",
        paragraphs: [
          "Brify transforme les longs documents en cartes de structure modifiables. Au lieu de produire seulement un résumé compact, il aide à séparer question, méthode, résultats et limites.",
          "Cette structure est plus facile à relire, modifier et réutiliser pour un rapport, une présentation ou une revue de littérature.",
        ],
      },
    ],
    closing:
      "Organiser un article scientifique ne consiste pas seulement à le raccourcir. Si un résumé vous paraît trop plat, Brify peut vous aider à construire une carte claire de l'article.",
  },
  {
    koSlug: "why-paper-summary-is-not-enough",
    slug: "pourquoi-un-resume-article-scientifique-ne-suffit-pas",
    title: "Pourquoi un résumé d'article scientifique ne suffit souvent pas",
    excerpt:
      "Un résumé d'article scientifique aide à lire plus vite, mais il peut perdre la méthode, les preuves et les limites qui rendent l'étude utile.",
    seo_keywords: [
      "résumé article scientifique",
      "résumer article scientifique IA",
      "limites résumé IA",
      "analyse article scientifique",
      "Brify",
    ],
    intro:
      "Un résumé d'article scientifique est utile. Il permet de comprendre rapidement le sujet et de décider si l'article mérite une lecture plus attentive. Mais pour travailler sérieusement avec une étude, le résumé seul atteint vite ses limites.",
    sections: [
      {
        heading: "Ce qu'un résumé fait bien",
        paragraphs: [
          "Un bon résumé donne de la vitesse. Il présente le thème, l'idée principale et parfois le résultat le plus visible.",
          "Quand vous découvrez un domaine, cela réduit la difficulté d'entrée dans un texte dense.",
        ],
      },
      {
        heading: "Ce qu'un résumé laisse souvent de côté",
        paragraphs: [
          "Le problème apparaît quand le résumé compresse la question, la méthode, les données, les limites et les nuances du vocabulaire scientifique.",
          "Ces détails sont pourtant essentiels pour savoir à quel point les résultats sont solides et dans quel contexte ils s'appliquent.",
        ],
      },
      {
        heading: "La méthode et les résultats doivent rester liés",
        paragraphs: [
          "Un résultat n'a pas le même sens selon l'échantillon, les données et la méthode utilisée. Séparer le résultat de son contexte peut conduire à une interprétation trop forte.",
          "Pour réutiliser un article, il faut garder la chaîne complète: question, méthode, résultats, limites.",
        ],
      },
      {
        heading: "Quand il faut plus qu'un résumé",
        paragraphs: [
          "Vous avez besoin d'une structure plus complète pour préparer une présentation, écrire un rapport, comparer plusieurs articles ou vérifier un résumé produit par IA.",
          "Dans ces cas, l'organisation compte plus que la simple compression.",
        ],
      },
      {
        heading: "Pourquoi utiliser Brify",
        paragraphs: [
          "Brify met l'accent sur la carte de structure plutôt que sur le résumé en un seul bloc. La logique de l'article reste visible et modifiable.",
          "Cela aide à relire l'article plus tard et à l'utiliser avec plus de prudence.",
        ],
      },
    ],
    closing:
      "Un résumé peut démarrer la lecture, mais une carte de structure aide à vraiment utiliser l'article. Brify est pensé pour ce moment où le résumé court ne suffit plus.",
  },
  {
    koSlug: "ai-paper-summary-tool-checklist",
    slug: "choisir-outil-ia-resume-article-scientifique",
    title: "Comment choisir un outil IA pour résumer un article scientifique",
    excerpt:
      "Avant de choisir un outil IA de résumé d'article scientifique, vérifiez la qualité du résumé, la traçabilité, la structure et les possibilités d'édition.",
    seo_keywords: [
      "outil IA résumé article scientifique",
      "résumeur IA article scientifique",
      "résumé IA PDF",
      "outil recherche IA",
      "Brify",
    ],
    intro:
      "Les outils IA pour résumer des articles scientifiques sont de plus en plus nombreux. Certains résument des PDF, d'autres répondent à des questions, d'autres extraient les idées clés. Le vrai sujet n'est pas seulement de savoir si le résumé semble fluide, mais si vous pouvez le vérifier et le réutiliser.",
    sections: [
      {
        heading: "La qualité du résumé",
        paragraphs: [
          "Un résumé utile doit couvrir le sujet, la question de recherche, la méthode, les résultats, les limites et l'usage possible de l'article.",
          "Si l'outil produit seulement une conclusion élégante, il risque de ne pas suffire pour un travail académique.",
        ],
      },
      {
        heading: "La traçabilité vers la source",
        paragraphs: [
          "Vous devez pouvoir revenir facilement au texte original. Les articles scientifiques utilisent souvent un langage prudent, et l'IA peut rendre certaines affirmations plus fortes qu'elles ne le sont.",
          "Un bon flux de travail facilite donc la vérification.",
        ],
      },
      {
        heading: "La structure de l'article",
        paragraphs: [
          "Un article scientifique n'est pas un simple bloc de texte. Il contient une question, une méthode, des résultats, une discussion et des limites.",
          "Le meilleur outil garde ces parties visibles au lieu de tout aplatir en un paragraphe.",
        ],
      },
      {
        heading: "L'édition et la réutilisation",
        paragraphs: [
          "La sortie d'une IA reste un brouillon. Vous devez pouvoir l'adapter à votre question, votre mémoire, votre rapport ou votre présentation.",
          "Une structure modifiable est plus utile qu'un résumé figé quand vous travaillez plusieurs jours sur le même article.",
        ],
      },
      {
        heading: "La place de Brify",
        paragraphs: [
          "Brify transforme les articles en cartes de structure. Vous pouvez examiner, modifier et partager la logique du document.",
          "C'est particulièrement utile lorsque vous avez besoin de plus qu'une réponse rapide.",
        ],
      },
    ],
    closing:
      "Choisissez un outil IA de résumé en vous demandant s'il vous aide à vérifier et réutiliser l'article. Brify donne une structure claire pour ce travail plus profond.",
  },
  makePost({
    koSlug: "paper-organization-routine-for-grad-students",
    slug: "routine-organisation-articles-scientifiques-etudiants",
    title: "Une routine pour organiser les articles scientifiques quand on est étudiant",
    excerpt:
      "Une routine hebdomadaire pour lire, organiser et réutiliser les articles scientifiques sans accumuler des notes inutilisables.",
    keywords: ["organisation articles scientifiques", "routine lecture article", "étudiant master doctorat"],
    intro:
      "Quand on est en master ou en doctorat, le problème n'est pas seulement de lire plus d'articles. Le vrai défi est de construire des notes qui s'accumulent et restent utiles après plusieurs semaines.",
    headings: [
      "Pourquoi vos notes doivent s'accumuler",
      "Avant la lecture: formuler votre question",
      "Pendant la lecture: relier méthode et résultats",
      "Après la lecture: connecter l'article à votre projet",
      "Utiliser Brify comme routine de lecture",
    ],
    finalAngle:
      "Une routine de lecture vous évite de recommencer à zéro à chaque article. Brify peut devenir l'espace où les articles prennent une forme claire et réutilisable.",
  }),
  makePost({
    koSlug: "can-you-read-only-paper-abstract",
    slug: "peut-on-comprendre-un-article-avec-seulement-abstract",
    title: "Peut-on comprendre un article scientifique avec seulement l'abstract ?",
    excerpt:
      "L'abstract est un bon point d'entrée, mais il montre rarement assez de méthode, de données et de limites pour comprendre l'article.",
    keywords: ["abstract article scientifique", "résumé abstract", "comprendre article scientifique"],
    intro:
      "Lire seulement l'abstract peut donner l'impression d'avoir compris un article. En réalité, l'abstract sert surtout à décider où regarder ensuite.",
    headings: [
      "Ce que l'abstract vous apprend",
      "Ce que l'abstract ne montre pas",
      "Pourquoi la méthode reste indispensable",
      "Séparer les résultats des conclusions",
      "Construire une structure après l'abstract",
    ],
    finalAngle:
      "L'abstract ouvre la porte, mais il ne remplace pas l'article. Brify aide à passer du premier aperçu à une compréhension structurée.",
  }),
  makePost({
    koSlug: "how-to-read-papers-faster",
    slug: "lire-articles-scientifiques-plus-vite-sans-perdre-logique",
    title: "Comment lire des articles scientifiques plus vite sans perdre la logique",
    excerpt:
      "Lire plus vite ne signifie pas sauter les idées importantes: il faut d'abord repérer la question, la méthode, les résultats et les limites.",
    keywords: ["lire article scientifique plus vite", "méthode lecture article", "résumé article"],
    intro:
      "La lecture linéaire d'un article scientifique prend souvent trop de temps. Pour aller plus vite sans perdre le sens, il faut chercher la structure avant les détails.",
    headings: [
      "Pourquoi la lecture linéaire prend trop de temps",
      "Les cinq endroits à scanner en premier",
      "Utiliser figures et tableaux avec prudence",
      "Suivre les termes clés",
      "Voir toute la structure avec Brify",
    ],
    finalAngle:
      "Lire vite, ce n'est pas lire au hasard. Brify vous aide à repérer la logique de l'article avant de plonger dans les passages difficiles.",
  }),
  makePost({
    koSlug: "pdf-paper-summary-mistakes",
    slug: "erreurs-resume-pdf-article-scientifique",
    title: "Les erreurs fréquentes quand on résume un article scientifique en PDF",
    excerpt:
      "Les résumés de PDF peuvent oublier les tableaux, figures, méthodes, limites et détails de source qui portent le sens de l'article.",
    keywords: ["résumé PDF article scientifique", "résumer PDF IA", "erreurs résumé article"],
    intro:
      "Un PDF scientifique n'est pas seulement du texte à compresser. Sa mise en page, ses tableaux, ses figures et ses notes jouent souvent un rôle dans l'interprétation.",
    headings: [
      "Pourquoi les PDF scientifiques sont particuliers",
      "Les tableaux et figures portent souvent le résultat",
      "Vérifier la méthode séparément",
      "Lire les résultats avec les limites",
      "Utiliser Brify pour structurer un PDF",
    ],
    finalAngle:
      "Un bon résumé de PDF doit respecter la structure du document. Brify aide à rendre cette structure visible au lieu de réduire l'article à quelques phrases.",
  }),
  makePost({
    koSlug: "research-paper-organization-checklist",
    slug: "checklist-organiser-un-article-scientifique",
    title: "Checklist pour organiser un article scientifique",
    excerpt:
      "Une checklist pour noter la question, la méthode, les résultats, les limites et l'intérêt d'un article scientifique.",
    keywords: ["checklist article scientifique", "organiser article scientifique", "notes de recherche"],
    intro:
      "Une checklist simple évite de produire des notes différentes à chaque lecture. Elle rend vos résumés plus cohérents et plus faciles à comparer.",
    headings: [
      "Pourquoi une checklist aide",
      "Les informations de base de l'article",
      "Question de recherche et hypothèse",
      "Méthode, données et corpus",
      "Résultats, limites et réutilisation",
    ],
    finalAngle:
      "La checklist n'est pas une contrainte: c'est une protection contre les notes dispersées. Brify peut vous aider à appliquer cette structure à chaque article.",
  }),
  makePost({
    koSlug: "paper-summary-for-report-risk",
    slug: "ne-pas-coller-resume-article-dans-rapport",
    title: "Pourquoi il ne faut pas coller directement un résumé d'article dans un rapport",
    excerpt:
      "Un résumé d'article peut aider à préparer un rapport, mais le copier tel quel peut faire perdre le contexte, les preuves et les limites.",
    keywords: ["résumé article rapport", "rapport de recherche", "preuve article scientifique"],
    intro:
      "Un résumé automatique peut donner l'impression que le travail est presque terminé. Pourtant, un rapport demande plus qu'un texte court: il demande une interprétation.",
    headings: [
      "Ce qui se passe quand on copie un résumé",
      "Citer n'est pas interpréter",
      "Inclure les limites",
      "Relier la preuve à votre argument",
      "Organiser les preuves avec Brify",
    ],
    finalAngle:
      "Un rapport solide utilise le résumé comme point de départ, pas comme résultat final. Brify aide à garder les preuves et les limites visibles.",
  }),
  makePost({
    koSlug: "chatgpt-paper-summary-checkpoints",
    slug: "verifier-resume-chatgpt-article-scientifique",
    title: "Que vérifier quand ChatGPT résume un article scientifique",
    excerpt:
      "Si vous utilisez ChatGPT pour résumer un article, vérifiez les sources, les sections manquantes, la méthode et les limites.",
    keywords: ["ChatGPT résumé article scientifique", "résumé IA article", "vérifier résumé ChatGPT"],
    intro:
      "ChatGPT peut accélérer la lecture d'un article, mais un résumé fluide n'est pas automatiquement un résumé fiable.",
    headings: [
      "Ce que ChatGPT fait bien",
      "Vérifier les preuves dans la source",
      "Surveiller l'interprétation de la méthode",
      "Les longs articles peuvent perdre des sections",
      "Garder la structure avec Brify",
    ],
    finalAngle:
      "Utiliser ChatGPT n'est pas un problème si vous gardez une étape de vérification. Brify aide à conserver une structure contrôlable autour du résumé.",
  }),
  makePost({
    koSlug: "research-paper-notes-structure",
    slug: "structurer-notes-article-scientifique",
    title: "Comment structurer ses notes d'article scientifique",
    excerpt:
      "De bonnes notes séparent la question de recherche, les concepts, la méthode, les résultats, les limites et vos propres idées.",
    keywords: ["notes article scientifique", "structurer notes recherche", "notes de lecture académique"],
    intro:
      "Les notes utiles ne sont pas seulement des citations copiées. Elles doivent permettre de retrouver rapidement la logique de l'article et votre propre réflexion.",
    headings: [
      "Ce que de bonnes notes doivent contenir",
      "Pourquoi un seul paragraphe ne suffit pas",
      "Séparer les notes par section",
      "Distinguer vos idées du texte de l'article",
      "Utiliser Brify comme carte de notes",
    ],
    finalAngle:
      "Des notes bien structurées gagnent de la valeur avec le temps. Brify vous aide à transformer chaque article en ressource réutilisable.",
  }),
  makePost({
    koSlug: "compare-multiple-research-papers",
    slug: "comparer-organiser-plusieurs-articles-scientifiques",
    title: "Comment comparer et organiser plusieurs articles scientifiques",
    excerpt:
      "Pour comparer plusieurs articles, utilisez les mêmes critères: question, échantillon, méthode, résultats et limites.",
    keywords: ["comparer articles scientifiques", "revue de littérature", "organisation bibliographie"],
    intro:
      "Quand plusieurs articles s'accumulent, les résumés séparés deviennent vite difficiles à comparer. Il faut des critères communs.",
    headings: [
      "Pourquoi plusieurs résumés deviennent confus",
      "Définir les critères de comparaison",
      "Comparer méthodes et données",
      "Comparer résultats et limites",
      "Utiliser Brify pour la comparaison",
    ],
    finalAngle:
      "Comparer des articles demande une grille stable. Brify aide à poser cette grille avant que les notes deviennent trop dispersées.",
  }),
  makePost({
    koSlug: "can-you-trust-ai-paper-summary",
    slug: "peut-on-faire-confiance-resume-ia-article-scientifique",
    title: "Peut-on faire confiance à un résumé IA d'article scientifique ?",
    excerpt:
      "Les résumés IA sont rapides, mais ils exigent encore une vérification de la source, de la méthode, des sections et des limites.",
    keywords: ["résumé IA article scientifique fiable", "résumé IA recherche", "fiabilité résumé IA"],
    intro:
      "Un résumé IA peut être très utile pour entrer dans un article. Mais la confiance doit venir d'une vérification, pas seulement d'un style fluide.",
    headings: [
      "Pourquoi un résumé IA peut se tromper",
      "Les longs articles perdent parfois des détails",
      "Les termes et méthodes peuvent être mal compris",
      "Revenir régulièrement à la source",
      "Rendre le résumé vérifiable avec Brify",
    ],
    finalAngle:
      "Un résumé IA est un bon début, pas un jugement final. Brify vous aide à garder la structure nécessaire pour vérifier ce que l'IA produit.",
  }),
  makePost({
    koSlug: "how-to-summarize-paper-methods",
    slug: "resumer-section-methodologie-article-scientifique",
    title: "Comment résumer la section méthodologie d'un article scientifique",
    excerpt:
      "Pour résumer la méthode, séparez participants, données, procédure, analyse et limites.",
    keywords: ["résumer méthodologie article", "méthode article scientifique", "section méthode résumé"],
    intro:
      "La section méthodologie peut sembler technique, mais elle est essentielle: elle indique dans quelles conditions les résultats ont été produits.",
    headings: [
      "Pourquoi la méthode compte",
      "Vérifier participants, données ou corpus",
      "Séparer procédure et analyse",
      "Relier méthode et résultats",
      "Cartographier la méthode avec Brify",
    ],
    finalAngle:
      "Résumer la méthode, c'est mesurer la solidité d'un résultat. Brify aide à garder ce lien visible pendant la lecture.",
  }),
  makePost({
    koSlug: "paper-results-vs-conclusion",
    slug: "resultats-vs-conclusion-article-scientifique",
    title: "Résultats et conclusion d'un article scientifique: quelle différence ?",
    excerpt:
      "Les résultats décrivent ce que les données montrent; la conclusion explique comment les auteurs interprètent ces résultats.",
    keywords: ["résultats conclusion article scientifique", "lire article scientifique", "résumé article"],
    intro:
      "Confondre résultats et conclusion est l'une des erreurs les plus fréquentes dans un résumé d'article scientifique.",
    headings: [
      "Pourquoi résultats et conclusion diffèrent",
      "Ce qu'il faut lire dans la section résultats",
      "Lire la conclusion avec prudence",
      "Repérer les affirmations trop fortes",
      "Les séparer dans Brify",
    ],
    finalAngle:
      "Séparer résultats et conclusion rend vos résumés plus précis. Brify aide à garder cette distinction claire.",
  }),
  makePost({
    koSlug: "why-paper-limitations-matter",
    slug: "pourquoi-limites-article-scientifique-sont-importantes",
    title: "Pourquoi les limites d'un article scientifique sont importantes",
    excerpt:
      "Les limites aident à interpréter un article avec précision et à éviter de surestimer ce que la recherche montre.",
    keywords: ["limites article scientifique", "résumer limites recherche", "interpréter article scientifique"],
    intro:
      "Les limites ne sont pas un détail secondaire. Elles définissent le périmètre réel des résultats.",
    headings: [
      "Pourquoi les limites comptent",
      "Limites liées à l'échantillon, aux données ou à la méthode",
      "Limites explicites et limites cachées",
      "Utiliser les limites dans un rapport",
      "Marquer les limites dans Brify",
    ],
    finalAngle:
      "Lire les limites, ce n'est pas affaiblir l'article: c'est l'utiliser correctement. Brify aide à les garder visibles.",
  }),
  makePost({
    koSlug: "paper-summary-for-presentation",
    slug: "utiliser-resume-article-scientifique-presentation",
    title: "Comment utiliser un résumé d'article scientifique pour une présentation",
    excerpt:
      "Une présentation doit ordonner le contexte, la question, la méthode, les résultats et les limites de façon claire.",
    keywords: ["résumé article présentation", "présentation article scientifique", "notes présentation recherche"],
    intro:
      "Présenter un article n'est pas la même chose que le résumer pour soi. Le public a besoin d'un chemin clair.",
    headings: [
      "Pourquoi une présentation demande une autre structure",
      "Construire d'abord le fil de la présentation",
      "Relier contexte et question de recherche",
      "Expliquer méthode et résultats simplement",
      "Construire le fil avec Brify",
    ],
    finalAngle:
      "Un bon résumé pour présentation doit guider l'auditoire. Brify aide à transformer l'article en fil logique.",
  }),
  makePost({
    koSlug: "what-to-check-after-ai-paper-organization",
    slug: "que-verifier-apres-organisation-ia-article-scientifique",
    title: "Que vérifier après qu'une IA a organisé un article scientifique",
    excerpt:
      "Même après une organisation par IA, vérifiez la question, la méthode, les résultats, les limites et le lien avec votre travail.",
    keywords: ["organisation IA article scientifique", "résumé IA article", "outil IA recherche"],
    intro:
      "L'IA peut faire gagner beaucoup de temps pour organiser un article. Mais la décision de recherche reste entre vos mains.",
    headings: [
      "Pourquoi l'organisation IA est utile",
      "Les cinq points à vérifier",
      "Relier l'article à votre objectif",
      "Revenir à la source",
      "Relire la structure IA dans Brify",
    ],
    finalAngle:
      "L'IA accélère l'organisation, mais vous devez garder le contrôle de l'interprétation. Brify sert précisément à rendre cette structure vérifiable.",
  }),
];

async function getKoreanPost(koSlug) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", koSlug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getExistingFrenchPost(post, translationGroupId) {
  const byGroup = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "fr")
    .eq("translation_group_id", translationGroupId)
    .maybeSingle();
  if (byGroup.error) throw byGroup.error;
  if (byGroup.data) return byGroup.data;

  const bySlug = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "fr")
    .eq("slug", post.slug)
    .maybeSingle();
  if (bySlug.error) throw bySlug.error;
  return bySlug.data;
}

const results = [];

for (const post of posts) {
  const koreanPost = await getKoreanPost(post.koSlug);
  const translationGroupId = koreanPost?.translation_group_id ?? randomUUID();
  const existing = await getExistingFrenchPost(post, translationGroupId);
  const markdown = insertDefaultBodyImage(buildMarkdown(post));
  const payload = {
    locale: "fr",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: post.seo_keywords,
    image_url: imageUrl,
    markdown,
    status: "draft",
    published_at: null,
    translation_group_id: translationGroupId,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", existing.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
