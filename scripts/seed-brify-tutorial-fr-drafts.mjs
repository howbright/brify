import fs from "node:fs";
import path from "node:path";
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

if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.");
}

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

const commonKeywords = [
  "comment utiliser Brify",
  "comment créer une carte de structure",
  "tutoriel Brify",
  "créer une carte de structure de document",
  "flux de travail carte de structure IA",
  "structuration de document",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Ce qu'il faut garder en tête dans Brify",
    `Le point le plus important dans ${post.title} est de ne pas considérer le résultat de l'IA comme une réponse finale. Brify vous donne une structure de départ rapide pour des documents longs, mais vous devez encore vérifier si cette structure correspond à votre objectif.`,
    "Après avoir ajouté votre document, regardez les grands titres, les sous-noeuds, les preuves, les exemples et les parties à vérifier. Si un titre est trop large, resserrez-le. Si deux noeuds disent presque la même chose, fusionnez-les. Si une conclusion manque de preuve, marquez-la pour vérification.",
    "Ainsi, la carte de structure devient plus qu'un résumé. Elle devient un document de travail que vous pouvez relire, expliquer, transformer en rapport ou utiliser en réunion.",
    "## Checklist pour une première utilisation",
    `Si vous travaillez aujourd'hui sur ${post.seo_keywords[0]}, vérifiez d'abord quatre points: pourquoi est-ce que j'organise ce contenu, quelle est la question la plus importante, les conclusions du brouillon IA sont-elles séparées des preuves, et où vais-je réutiliser cette structure plus tard ?`,
    "Quand ces quatre éléments sont clairs, la qualité de la carte devient beaucoup plus stable. L'objectif n'est pas d'obtenir un premier résultat parfait. L'objectif est de laisser une structure que vous pourrez revoir et améliorer.",
    "## Erreurs fréquentes",
    "La première erreur consiste à faire confiance au résultat immédiatement après l'ajout du document. L'IA peut créer un brouillon rapide, mais elle peut manquer un contexte important ou ne pas signaler assez clairement les limites de la source.",
    "La deuxième erreur consiste à croire qu'une bonne carte est celle qui contient le plus de noeuds. Une bonne carte de structure est celle où la question, les preuves et l'étape suivante sont faciles à voir.",
    "La troisième erreur consiste à enregistrer la carte sans jamais la réutiliser. Une carte de structure prend de la valeur quand elle devient des questions de révision, un plan de rapport, un ordre du jour ou un fil de présentation.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-use-brify",
    slug: "comment-utiliser-brify",
    title: "Comment utiliser Brify: guide rapide pour bien commencer",
    excerpt:
      "Découvrez le flux de base de Brify: ajouter un document, relire le brouillon IA, modifier la carte de structure et la réutiliser pour étudier, rédiger ou préparer une réunion.",
    seo_keywords: ["comment utiliser Brify", "tutoriel Brify", "carte de structure Brify", "guide Brify", ...commonKeywords],
    intro:
      "Quand vous ouvrez Brify pour la première fois, il n'est pas toujours évident de savoir quoi ajouter. Vous pouvez avoir des articles scientifiques, des PDF, des transcriptions YouTube, des documents de réunion ou des rapports, mais essayer toutes les fonctions dès le départ rend souvent le flux plus lourd. La bonne manière d'utiliser Brify n'est pas seulement de raccourcir un contenu long. C'est de le transformer en carte de structure que vous pourrez revoir plus tard.",
    sections: [
      {
        heading: "Dans quels cas Brify est le plus utile",
        paragraphs: [
          "Brify est utile quand vous devez lire un document long et reconstruire son fil principal. Il convient bien à un article à intégrer dans une revue de littérature, à un rapport PDF dont vous voulez extraire les preuves clés, à une vidéo de cours à réviser ou à des documents de réunion à transformer en points d'ordre du jour.",
          "Si vous avez seulement besoin d'un résumé en un paragraphe, un simple outil de résumé peut suffire. Mais si vous devez vérifier les preuves plus tard, transformer le contenu en plan, le comparer avec d'autres sources ou le réutiliser en réunion, une carte de structure devient plus utile.",
        ],
      },
      {
        heading: "Quel document ajouter en premier",
        paragraphs: [
          "Pour une première utilisation, choisissez un document avec des limites claires. Un seul article, un PDF, un document de réunion ou une transcription de cours est plus facile à vérifier qu'un grand dossier rempli de contenus mélangés.",
          "Avant de l'ajouter, écrivez votre objectif en une phrase. Par exemple: 'Je veux savoir si cet article peut servir à ma revue de littérature' ou 'Je veux trouver les décisions cachées dans ce document de réunion'. Un objectif clair vous donne un critère pour juger la carte.",
        ],
      },
      {
        heading: "Ne pas faire trop confiance au brouillon IA",
        paragraphs: [
          "Le brouillon IA dans Brify est un point de départ. Il peut montrer rapidement les grands thèmes et sous-thèmes, mais cela ne signifie pas que chaque conclusion est entièrement vérifiée.",
          "Quand vous relisez le brouillon, ne regardez pas seulement la conclusion. Vérifiez si la preuve est visible, si une affirmation importante demande une relecture de la source et si certaines parties doivent être marquées comme incertaines.",
        ],
      },
      {
        heading: "Que vérifier dans la carte de structure",
        paragraphs: [
          "Une carte utile sépare la question centrale, les grands thèmes, les preuves, les exemples et les limites. Si tout apparaît au même niveau, la carte peut devenir difficile à réutiliser.",
          "Les noms des noeuds comptent aussi. Au lieu de garder de longues phrases générées par l'IA, renommez les noeuds par leur rôle: affirmation principale, preuve, contrepoint ou à vérifier. La carte devient alors plus facile à reprendre.",
        ],
      },
      {
        heading: "Réutiliser le résultat pour étudier, rédiger et préparer des réunions",
        paragraphs: [
          "Une carte de structure ne doit pas finir dans un dossier d'archives. Pour étudier, elle peut devenir une série de questions de révision. Pour un rapport, elle peut devenir un plan et une liste de preuves. Pour une réunion, elle peut devenir des points d'ordre du jour et des questions ouvertes.",
          "Commencez petit. Transformez un seul document en carte de structure, puis réutilisez cette structure dans la tâche suivante. C'est là que Brify devient plus qu'un outil de résumé.",
        ],
      },
    ],
    closing:
      "Vous n'avez pas besoin de commencer Brify de manière compliquée. Ajoutez un article ou un PDF que vous devez déjà lire, relisez le brouillon IA, puis ajustez la structure selon votre propre objectif.",
  },
  {
    koSlug: "how-to-make-a-structure-map",
    slug: "comment-creer-carte-structure",
    title: "Comment créer une carte de structure pour des documents longs",
    excerpt:
      "Apprenez à créer une carte de structure en séparant question centrale, affirmations, preuves, exemples, limites et prochaines actions.",
    seo_keywords: ["comment créer une carte de structure", "méthode de structuration de document", "guide carte de structure", "carte de structure texte", ...commonKeywords],
    intro:
      "Quand on parle de carte de structure, beaucoup de personnes imaginent une carte mentale avec de nombreuses branches. Pourtant, le but n'est pas de créer un beau schéma. Il s'agit de rendre de nouveau visibles la question, les affirmations et les preuves contenues dans un document long. Une fois cette méthode comprise, les articles, rapports, notes de réunion et cours deviennent beaucoup plus faciles à organiser.",
    sections: [
      {
        heading: "Différence entre carte de structure et carte mentale",
        paragraphs: [
          "Une carte mentale est utile pour développer des idées à partir d'un mot-clé central. Elle fonctionne bien pour le brainstorming et l'exploration de concepts associés.",
          "Une carte de structure se concentre plutôt sur la réorganisation d'un contenu existant en relations compréhensibles. La question centrale, les affirmations, les preuves, les exemples et les limites comptent plus que le mot-clé central.",
        ],
      },
      {
        heading: "Trouver d'abord la question centrale",
        paragraphs: [
          "La première étape consiste à trouver la question à laquelle le document essaie de répondre. Demandez-vous: que veut prouver cet article, quelle décision ce rapport soutient-il, ou que doivent aider à décider ces documents de réunion ?",
          "Sans question centrale, chaque phrase peut sembler importante. Avec une question, vous pouvez distinguer le point principal des informations de contexte.",
        ],
      },
      {
        heading: "Séparer affirmations, preuves et exemples",
        paragraphs: [
          "Quand vous structurez un long contenu, séparez les affirmations des preuves. Si vous ne gardez que des phrases de conclusion, il devient difficile de comprendre plus tard pourquoi ces conclusions ont été tirées.",
          "Données, exemples, citations et explications jouent des rôles différents. Une carte de structure doit rendre ces rôles visibles pour que le contenu puisse être réutilisé avec prudence dans un rapport ou une présentation.",
        ],
      },
      {
        heading: "Isoler les limites et les points à vérifier",
        paragraphs: [
          "Une bonne carte ne contient pas seulement des affirmations sûres. Elle doit aussi marquer les points flous, les limites et les passages à relire dans la source.",
          "Cela évite de faire trop confiance à un brouillon IA ou à votre premier résumé. Une carte de structure doit aider à comprendre, mais aussi à vérifier.",
        ],
      },
      {
        heading: "Créer un brouillon de carte dans Brify",
        paragraphs: [
          "Vous pouvez créer une carte manuellement, mais les documents longs rendent la première classification lente. Dans Brify, vous pouvez ajouter le contenu et voir rapidement un brouillon avec question centrale, grands thèmes, preuves et points à relire.",
          "Ensuite, vous pouvez renommer les noeuds, ajouter les preuves manquantes, fusionner les branches similaires et retirer ce qui ne sert pas votre objectif.",
        ],
      },
    ],
    closing:
      "Le coeur d'une carte de structure n'est pas le nombre de branches. C'est la relation entre question, affirmation, preuve et limite. Utilisez Brify pour transformer un document long en structure réellement vérifiable.",
  },
  {
    koSlug: "make-first-structure-map-in-brify",
    slug: "creer-premiere-carte-structure-brify",
    title: "Créer sa première carte de structure dans Brify",
    excerpt:
      "Un tutoriel pratique pour choisir un premier document, l'ajouter à Brify, relire le brouillon IA, modifier les noeuds et réutiliser le résultat.",
    seo_keywords: ["créer une carte de structure Brify", "première utilisation Brify", "ajouter des documents dans Brify", "tutoriel carte de structure IA", ...commonKeywords],
    intro:
      "Avant de créer votre première carte dans Brify, deux questions reviennent souvent: quel document ajouter, et comment savoir si le résultat est correct ? Votre première carte n'a pas besoin d'être parfaite. Elle sert à voir le grand fil d'un document et à apprendre à le modifier pour obtenir une structure utilisable.",
    sections: [
      {
        heading: "Choisir un document pas trop difficile",
        paragraphs: [
          "Pour commencer, évitez d'ajouter un livre entier ou plusieurs PDF à la fois. Choisissez un contenu avec un début et une fin clairs: un article, une transcription de cours ou un document de réunion.",
          "Un contenu plus petit rend le brouillon IA plus facile à vérifier et vous aide à comprendre comment Brify construit une structure.",
        ],
      },
      {
        heading: "Écrire son objectif avant d'ajouter le document",
        paragraphs: [
          "Avant d'ajouter le contenu, écrivez une phrase qui explique pourquoi vous l'organisez. Par exemple: 'Je veux trouver les preuves utiles pour mon rapport dans ce PDF' ou 'Je veux transformer ce cours en questions de révision'.",
          "Un objectif clair vous aide à distinguer les noeuds importants des noeuds secondaires. Le même document peut demander une structure différente pour étudier, rédiger un rapport ou préparer une réunion.",
        ],
      },
      {
        heading: "Que regarder d'abord dans le brouillon IA",
        paragraphs: [
          "Quand Brify crée la première carte, commencez par les grands titres et les sections principales. Vérifiez si le fil général du document a été correctement capturé.",
          "Ensuite, regardez si conclusions et preuves sont séparées, si des exemples importants manquent et si certains passages doivent être relus dans la source. Ne modifiez pas tout de suite chaque phrase. Regardez d'abord la grande structure.",
        ],
      },
      {
        heading: "Renommer les noeuds selon votre propre flux de travail",
        paragraphs: [
          "Les noms de noeuds générés par l'IA peuvent rester trop proches du texte original ou être trop longs. Renommez-les pour qu'ils correspondent à votre objectif.",
          "Par exemple, au lieu de 'discussion des résultats de recherche', vous pouvez utiliser 'résultats clés', 'limites' ou 'preuves pour mon rapport'. Les noms basés sur le rôle rendent la carte plus facile à réutiliser.",
        ],
      },
      {
        heading: "Chercher une structure réutilisable, pas parfaite",
        paragraphs: [
          "Le but de la première carte n'est pas la perfection. C'est la réutilisation. Si vous pouvez retrouver rapidement la question centrale, la conclusion, les preuves et les points à vérifier, vous avez déjà une base utile.",
          "Après la création, essayez de transformer la carte en questions de révision, en plan de rapport ou en ordre du jour. C'est à ce moment que la valeur de la structure devient claire.",
        ],
      },
    ],
    closing:
      "Pour créer votre première carte de structure dans Brify, il suffit d'un document et d'une phrase d'objectif. Commencez petit, relisez le brouillon IA et ajustez la structure selon votre manière de travailler.",
  },
  {
    koSlug: "clean-up-complex-structure-map",
    slug: "simplifier-carte-structure-complexe",
    title: "Comment simplifier une carte de structure trop complexe",
    excerpt:
      "Apprenez à simplifier une carte de structure en fusionnant les noeuds doublons, en raccourcissant les titres, en marquant les affirmations sans preuve et en supprimant les branches hors sujet.",
    seo_keywords: ["simplifier une carte de structure", "modifier une carte de structure", "édition carte de structure IA", "nettoyage structure document", ...commonKeywords],
    intro:
      "Il arrive qu'une carte générée par l'IA ou construite à la main paraisse trop complexe. Il y a beaucoup de noeuds, mais le point important ne se voit plus. Les titres sont longs, les branches se répètent et la carte finit par ressembler à un autre document long. Simplifier une carte de structure ne consiste pas à la rendre plus jolie. Il s'agit de la rendre réutilisable.",
    sections: [
      {
        heading: "Pourquoi une carte devient trop complexe",
        paragraphs: [
          "Une carte devient souvent complexe quand chaque partie de la source est copiée au même niveau. Conclusions, détails de contexte, exemples et conditions apparaissent avec le même poids, ce qui rend le fil moins clair.",
          "Cela peut aussi arriver avec les brouillons IA. L'IA extrait rapidement beaucoup d'éléments, mais la hiérarchie adaptée à votre objectif demande encore une relecture humaine.",
        ],
      },
      {
        heading: "Fusionner les doublons et expressions proches",
        paragraphs: [
          "Commencez par repérer les noeuds qui disent presque la même chose. Fusionnez-les dans un seul noeud et gardez uniquement les détails utiles en dessous.",
          "Réduire les doublons rend la carte plus compacte et fait ressortir le fil principal. Fusionner est souvent plus sûr que supprimer trop tôt.",
        ],
      },
      {
        heading: "Transformer les longs titres en noms de rôle",
        paragraphs: [
          "Si les titres de noeuds sont trop longs, la carte devient difficile à parcourir. Au lieu d'utiliser une phrase complète comme titre, nommez le rôle du noeud.",
          "Par exemple, 'les utilisateurs quittent la première expérience parce qu'ils ne comprennent pas la fonction' peut devenir 'cause d'abandon au premier usage'. Les détails peuvent rester dans le noeud.",
        ],
      },
      {
        heading: "Marquer les affirmations sans preuve",
        paragraphs: [
          "Si un noeud contient une conclusion mais que la preuve n'est pas visible, ne le supprimez pas immédiatement. Marquez-le comme à vérifier pour revenir à la source plus tard.",
          "C'est particulièrement important avec les brouillons IA. Un résumé peut sembler plausible même si la preuve source est faible. Une carte de structure doit rendre ces zones plus visibles.",
        ],
      },
      {
        heading: "Une routine de simplification dans Brify",
        paragraphs: [
          "Dans Brify, un bon ordre de nettoyage consiste à vérifier les doublons, raccourcir les titres longs, marquer les affirmations sans preuve et retirer les branches qui ne servent pas votre objectif.",
          "Après cette routine, la carte peut être plus courte, mais elle ne doit pas être plus pauvre. Elle doit être plus proche d'une structure que vous pourrez réutiliser.",
        ],
      },
    ],
    closing:
      "Si votre carte semble trop complexe, cela ne veut pas dire que le résultat a échoué. Dans Brify, simplifiez les doublons, les titres longs, les affirmations sans preuve et les points à vérifier pour obtenir une carte plus utilisable.",
  },
  {
    koSlug: "reuse-brify-structure-map",
    slug: "reutiliser-carte-structure-brify",
    title: "Réutiliser une carte de structure Brify pour étudier, rédiger et préparer des réunions",
    excerpt:
      "Découvrez comment réutiliser une carte Brify comme questions de révision, plan de rapport, fil de présentation, ordre du jour ou liste d'actions.",
    seo_keywords: ["réutiliser une carte de structure Brify", "flux de travail carte de structure", "réutiliser des documents organisés", "cas d'usage carte de structure IA", ...commonKeywords],
    intro:
      "Une carte de structure prend de la valeur quand vous la réutilisez. Si vous l'enregistrez simplement après l'avoir créée dans Brify, vous perdez une grande partie de son intérêt. Pour étudier, elle peut devenir des questions de révision. Pour rédiger, elle peut devenir un plan de rapport et une liste de preuves. Pour une réunion, elle peut devenir un ordre du jour et des actions.",
    sections: [
      {
        heading: "Pourquoi enregistrer une carte ne suffit pas",
        paragraphs: [
          "Beaucoup d'outils d'organisation donnent une impression de satisfaction au moment de créer le résultat, puis ce résultat reste fermé. Les cartes de structure peuvent devenir le même type de document inutilisé si vous ne les reliez pas à votre prochaine tâche.",
          "Si la structure créée ne devient pas le point de départ d'une révision, d'une rédaction ou d'une discussion, le temps passé à organiser ne se transforme pas en progrès réel.",
        ],
      },
      {
        heading: "Transformer les contenus d'étude en questions de révision",
        paragraphs: [
          "Si vous avez utilisé Brify pour cartographier un article ou un cours, transformez chaque grand noeud en question de révision. Un noeud concept peut devenir 'que signifie ce concept', et un noeud preuve peut devenir 'qu'est-ce qui soutient cette conclusion ?'",
          "La carte passe alors d'un résumé passif à un outil d'étude actif pour les examens, les présentations ou les réunions de recherche.",
        ],
      },
      {
        heading: "Transformer la carte en plan de rapport ou de présentation",
        paragraphs: [
          "Pour un rapport ou une présentation, le fil principal de la carte peut devenir un plan. Question centrale, contexte, conclusion, preuves, limites et proposition peuvent former le premier brouillon de structure.",
          "Ne copiez pas la carte telle quelle. Réorganisez-la dans l'ordre qui sera le plus compréhensible pour votre lecteur ou votre public.",
        ],
      },
      {
        heading: "Créer un ordre du jour et des actions",
        paragraphs: [
          "Pour des documents professionnels, une carte de structure peut devenir un ordre du jour. Séparez ce qui doit être décidé, ce qui doit être discuté, ce qui demande plus de données et qui porte la prochaine action.",
          "Après la réunion, mettez la carte à jour avec les décisions et les actions. Le même contenu peut alors continuer dans la réunion suivante au lieu de disparaître dans des notes.",
        ],
      },
      {
        heading: "Continuer à mettre à jour la carte Brify",
        paragraphs: [
          "Il vaut mieux traiter une carte de structure comme un document de travail vivant, pas comme un fichier terminé. Quand vous lisez un nouveau contenu ou prenez une décision en réunion, ajoutez-le à la structure existante.",
          "Avec cette habitude, Brify devient plus qu'un outil de résumé. Il devient un espace de travail pour accumuler et réutiliser des connaissances structurées.",
        ],
      },
    ],
    closing:
      "La clé d'une carte de structure Brify est la réutilisation. Transformez-la en questions de révision, plan de rapport, ordre du jour ou actions pour qu'elle devienne le point de départ de votre prochaine tâche.",
  },
];

async function getKoreanGroupId(koSlug) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", koSlug)
    .maybeSingle();
  if (error) throw error;
  if (!data?.translation_group_id) {
    throw new Error(`Missing Korean source post or translation_group_id for ${koSlug}`);
  }
  return data.translation_group_id;
}

async function getExistingPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id")
    .eq("locale", "fr")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const [translationGroupId, existing] = await Promise.all([getKoreanGroupId(post.koSlug), getExistingPost(post)]);
  const markdown = insertDefaultBodyImage(buildMarkdown(post));
  const payload = {
    locale: "fr",
    slug: post.slug,
    title: post.title,
    excerpt: post.excerpt,
    seo_keywords: Array.from(new Set(post.seo_keywords)),
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
