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
  "organiser un rapport d'étude de marché",
  "structurer les documents de réunion",
  "organisation recherche business",
  "organisation analyse concurrentielle",
  "suivi décisions réunion",
  "structure document professionnel",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Transformer les documents professionnels en structure de décision dans Brify",
    `Le point important dans ${post.title} n'est pas de raccourcir le contenu. Il s'agit de l'organiser pour qu'il mène au prochain jugement et à la prochaine action. Rapports d'étude de marché, analyses concurrentielles, insights clients et documents de réunion ne sont pas seulement des documents à lire. Ce sont des entrées pour décider.`,
    "Dans Brify, vous pouvez transformer des documents professionnels en carte de structure avec des noeuds comme question centrale, informations marché/client/concurrent, preuve, interprétation, points ouverts, décisions, actions, responsables et échéances. Cela évite que les synthèses de recherche et les comptes rendus de réunion restent dispersés.",
    "Dans le travail réel, plus il y a d'informations, plus la conclusion peut devenir floue. Si chiffres, verbatims clients, fonctions concurrentes et avis de réunion sont placés dans le même paragraphe, il devient difficile de distinguer le fait, l'interprétation et l'action suivante.",
    "## Quand une carte de structure devient plus utile",
    "Une carte de structure est particulièrement utile quand vous avez lu un rapport d'étude de marché sans pouvoir expliquer ce qu'il signifie pour votre produit ou projet, quand les documents de réunion sont longs mais que la décision réelle reste floue, ou quand un compte rendu existe sans responsables ni prochaines actions claires.",
    "Elle aide aussi lorsque les résultats de recherche et les décisions de réunion sont stockés séparément et ne deviennent jamais un plan d'action. À ce stade, la solution n'est pas une synthèse plus longue. Il faut une structure qui relie insight, décision et action.",
    "## Checklist professionnelle",
    `Si vous travaillez aujourd'hui sur ${post.seo_keywords[0]}, vérifiez quatre points: à quelle question de décision ce document répond-il, les preuves et interprétations sont-elles séparées, les points de réunion sont-ils visibles, et le contenu est-il relié à des prochaines actions et responsables ?`,
    "Si ces quatre éléments ne sont pas visibles, le document peut sembler organisé sans être prêt pour l'exécution. Le transformer en carte de structure Brify relie recherche, réunions et plan d'action dans un même flux.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "organize-market-research-report",
    slug: "organiser-rapport-etude-marche",
    title: "Comment organiser un rapport d'étude de marché et ne garder que l'essentiel",
    excerpt:
      "Apprenez à organiser un rapport d'étude de marché par taille du marché, segments clients, concurrence, croissance, risques et hypothèses d'action.",
    seo_keywords: ["organiser un rapport d'étude de marché", "organisation étude de marché", "organisation rapport recherche", "synthèse rapport analyse marché", ...commonKeywords],
    intro:
      "Un rapport d'étude de marché contient souvent chiffres, graphiques, tendances sectorielles, segments clients et informations concurrentielles en même temps. Si vous le terminez sans pouvoir dire ce qui compte pour votre équipe, le travail n'est pas terminé. Organiser un rapport d'étude de marché ne consiste pas à le raccourcir, mais à le transformer en structure qui soutient une décision.",
    sections: [
      {
        heading: "Pourquoi les rapports d'étude de marché sont longs et difficiles à utiliser",
        paragraphs: [
          "Ces rapports combinent souvent tendances macro, comportement client, concurrence et évolutions technologiques dans un seul document. Vous pouvez comprendre le contenu pendant la lecture sans réussir à le transformer en jugement business.",
          "Copier les chiffres du rapport ne suffit pas. Il faut savoir si un chiffre sert à l'entrée sur le marché, au pricing, à la priorité produit, au positionnement ou au message marketing.",
        ],
      },
      {
        heading: "Commencer par la question de décision",
        paragraphs: [
          "Avant d'organiser le rapport, décidez à quelle question il doit répondre. Par exemple: ce marché vaut-il la peine d'être attaqué, quel segment client cibler en premier, ou quel message utiliser face aux concurrents ?",
          "Sans question, chaque graphique semble important. Avec une question, vous pouvez séparer les données utiles du contexte.",
        ],
      },
      {
        heading: "Séparer taille du marché, clients, concurrence et risques",
        paragraphs: [
          "Une structure pratique consiste à séparer taille du marché, moteurs de croissance, segments clients, concurrents, risques et opportunités d'exécution. Cela découpe un long rapport en unités utiles à la décision.",
          "La taille du marché aide à juger l'opportunité, les segments clients aident au ciblage, la concurrence aide à la différenciation et les risques aident à ajuster les priorités.",
        ],
      },
      {
        heading: "Séparer données et interprétation",
        paragraphs: [
          "Le chiffre du rapport et votre interprétation de ce chiffre sont deux choses différentes. Une croissance de 20 pour cent est une donnée. Dire que le marché est attractif est une interprétation.",
          "Si vous gardez la donnée comme preuve et l'interprétation de l'équipe comme note séparée, les discussions deviennent plus claires car fait et jugement ne se mélangent pas.",
        ],
      },
      {
        heading: "Créer une carte d'étude de marché dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez organiser un rapport d'étude de marché en marché, client, concurrence, risque et hypothèse d'action. C'est plus utile pour décider qu'un résumé en un paragraphe.",
          "Partager la carte avant une réunion aide l'équipe à voir d'où viennent les différentes interprétations.",
        ],
      },
    ],
    closing:
      "L'objectif n'est pas de produire un rapport plus court. Utilisez Brify pour relier marché, client, concurrence, risque et hypothèses d'action dans une structure qui soutient la prochaine décision.",
  },
  {
    koSlug: "organize-competitor-analysis",
    slug: "organiser-analyse-concurrentielle",
    title: "Comment organiser des documents d'analyse concurrentielle",
    excerpt:
      "Une analyse concurrentielle devient utile quand fonctions, prix, clients, messages, forces, faiblesses et opportunités de différenciation sont organisés ensemble.",
    seo_keywords: ["organiser analyse concurrentielle", "organisation recherche concurrents", "tableau comparaison concurrents", "analyse concurrentielle étude marché", ...commonKeywords],
    intro:
      "Une analyse concurrentielle devient vite une pile de liens. Sites web, pages de prix, listes de fonctionnalités, avis clients, publicités et actualités de financement s'accumulent, mais la conclusion peut rester floue. Organiser une analyse concurrentielle ne consiste pas à dresser une liste de concurrents, mais à trouver les critères de décision et les hypothèses de différenciation pour votre produit ou service.",
    sections: [
      {
        heading: "Pourquoi la recherche concurrentielle se complique vite",
        paragraphs: [
          "Les documents concurrents ont des formats différents. Certains portent sur les fonctionnalités, d'autres sur les prix, d'autres encore sur les avis, le message de marque ou les pages commerciales.",
          "Si vous les regroupez seulement par concurrent, la comparaison devient difficile. Les critères de comparaison doivent être organisés d'abord.",
        ],
      },
      {
        heading: "Choisir les critères avant de collecter davantage",
        paragraphs: [
          "Comparer toutes les fonctionnalités et tous les prix crée souvent un grand tableau avec une conclusion faible. Commencez par les critères qui comptent pour votre décision.",
          "Le focus change selon que les premiers clients se soucient surtout du prix, de la simplicité, de la collaboration, de la sécurité, de l'onboarding ou des intégrations.",
        ],
      },
      {
        heading: "Séparer fonctionnalités, prix, clients et message",
        paragraphs: [
          "Une analyse utile sépare fonctionnalités, prix, segment client, message central, forces, faiblesses et plaintes répétées dans les avis.",
          "Le segment client et le message comptent souvent plus qu'un tableau de fonctions. Deux produits peuvent avoir des fonctions proches mais des positions de marché très différentes.",
        ],
      },
      {
        heading: "Transformer forces et faiblesses en hypothèses d'action",
        paragraphs: [
          "Trouver les faiblesses des concurrents ne suffit pas. Il faut décider si cette faiblesse est une opportunité pour votre produit ou une difficulté de tout le marché.",
          "Si les avis répètent que la configuration est difficile, cela peut devenir une hypothèse pour améliorer votre message d'onboarding ou la première expérience utilisateur.",
        ],
      },
      {
        heading: "Construire une structure de comparaison dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez créer à la fois des noeuds concurrents et des noeuds de critères. Relier fonctions, prix, clients, messages, plaintes et opportunités rend la conclusion plus claire.",
          "La même carte peut être réutilisée dans les réunions produit, les revues de message et les discussions de pricing.",
        ],
      },
    ],
    closing:
      "L'analyse concurrentielle ne sert pas à connaître plus de concurrents. Elle sert à décider ce que vous devez faire autrement. Utilisez Brify pour organiser critères de comparaison et hypothèses de différenciation.",
  },
  {
    koSlug: "organize-customer-insights",
    slug: "organiser-insights-clients",
    title: "Comment transformer les insights clients en décisions produit et marketing",
    excerpt:
      "Les insights clients doivent être organisés par segment, problème, formulations répétées, raisons d'achat, raisons de départ et hypothèses produit.",
    seo_keywords: ["organiser insights clients", "organisation entretiens clients", "organisation résultats sondage", "analyse avis clients", ...commonKeywords],
    intro:
      "Entretiens clients, réponses de sondage, avis d'application, tickets support et notes d'appels commerciaux sont tous précieux. Mais comme ils viennent dans des formats différents, les mettre au même endroit ne crée pas automatiquement une décision produit ou un message marketing. Organiser les insights clients consiste moins à produire un beau résumé qu'à trouver des problèmes répétés et des hypothèses actionnables.",
    sections: [
      {
        heading: "Pourquoi les données clients se dispersent",
        paragraphs: [
          "Les données clients varient selon le canal. Les entretiens sont longs, les sondages courts, les avis chargés d'émotion et les tickets support centrés sur des problèmes.",
          "Si vous les collectez simplement telles quelles, vous avez beaucoup de voix clients mais vous ne savez pas encore quel problème résoudre en premier.",
        ],
      },
      {
        heading: "Séparer d'abord segments et situations",
        paragraphs: [
          "Tous les commentaires clients n'ont pas le même poids. Commencez par séparer nouveaux utilisateurs, utilisateurs avancés, clients partis et prospects proches de l'achat.",
          "La même plainte peut conduire à une priorité produit différente selon qui l'exprime et dans quelle situation.",
        ],
      },
      {
        heading: "Trouver les frictions répétées et les formulations exactes",
        paragraphs: [
          "Dans les insights clients, les motifs répétés comptent plus qu'une opinion isolée très forte. Si plusieurs clients décrivent la même friction avec des mots proches, c'est peut-être un vrai signal.",
          "Les mots exacts des clients sont aussi utiles pour le marketing. Gardez le langage client séparé de l'interprétation de l'équipe pour le réutiliser plus précisément.",
        ],
      },
      {
        heading: "Relier les insights aux décisions produit et marketing",
        paragraphs: [
          "Les insights restent faibles s'ils s'arrêtent à ce que le client a dit. Il faut décider si chaque insight se relie à l'amélioration produit, l'onboarding, le prix, le contenu ou la publicité.",
          "Par exemple, un avis disant que le produit est utile mais difficile à démarrer peut pointer vers le parcours de première utilisation ou les messages de tutoriel plutôt que vers plus de fonctionnalités.",
        ],
      },
      {
        heading: "Structurer les insights clients dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez relier segment client, problème, formulation originale, fréquence, hypothèse produit et message marketing dans une carte de structure.",
          "Cela aide les équipes produit et marketing à utiliser la même matière client pour des décisions différentes sans perdre le signal d'origine.",
        ],
      },
    ],
    closing:
      "Le travail sur les insights clients ne consiste pas seulement à résumer ce que les clients ont dit. Utilisez Brify pour relier segments, problèmes, formulations répétées et hypothèses produit à de vraies décisions.",
  },
  {
    koSlug: "structure-meeting-materials-before-meeting",
    slug: "structurer-documents-reunion-avant",
    title: "Comment structurer les documents de réunion avant une réunion",
    excerpt:
      "Structurer les documents de réunion avant la réunion aide à séparer ordre du jour, contexte, décisions, points ouverts, questions et informations manquantes.",
    seo_keywords: ["structurer les documents de réunion", "organiser documents réunion", "organisation ordre du jour réunion", "préparer documents réunion", ...commonKeywords],
    intro:
      "Vous pouvez lire les documents de réunion à l'avance et entrer quand même en réunion sans savoir clairement ce qui doit être décidé. Comprendre le contenu et le structurer pour une réunion sont deux tâches différentes. Structurer les documents de réunion ne signifie pas rédiger un compte rendu. C'est rendre visibles l'ordre du jour et les points de décision avant le début.",
    sections: [
      {
        heading: "Ce qui se passe quand on lit seulement les documents",
        paragraphs: [
          "Les documents de réunion contiennent souvent contexte, données, propositions, points ouverts et liens de référence ensemble. Les lire dans l'ordre aide à comprendre le contenu, mais pas forcément ce qui doit être discuté d'abord.",
          "Plus la réunion est courte, plus il est important de séparer décisions et questions plutôt que de tout résumer.",
        ],
      },
      {
        heading: "Séparer ordre du jour et contexte",
        paragraphs: [
          "L'ordre du jour est ce que la réunion doit traiter. Le contexte est ce qui aide à comprendre cet ordre du jour. Si les deux se mélangent, la réunion peut devenir une longue séance d'explication.",
          "Avant la réunion, listez d'abord les points d'ordre du jour et reliez seulement le contexte nécessaire sous chacun.",
        ],
      },
      {
        heading: "Marquer ce qui doit être décidé",
        paragraphs: [
          "Le point le plus important à marquer est la décision attendue. La réunion sert-elle à partager des avis, approuver une proposition ou choisir une priorité ?",
          "Quand le point de décision est visible, la discussion risque moins de s'éloigner du but.",
        ],
      },
      {
        heading: "Préparer les points ouverts et questions",
        paragraphs: [
          "Les conflits possibles et les questions doivent être séparés avant la réunion. Les zones floues ignorées pendant la lecture reviennent souvent en réunion et prennent du temps.",
          "Les points ouverts peuvent être groupés en désaccord, données manquantes, impact client, risque planning ou risque de ressources.",
        ],
      },
      {
        heading: "Créer une carte pré-réunion dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez organiser les documents de réunion en ordre du jour, contexte, décision, point ouvert, question et document complémentaire.",
          "Quand cette structure est partagée avant la réunion, les participants arrivent avec le même fil de discussion en tête.",
        ],
      },
    ],
    closing:
      "Structurer les documents de réunion ne signifie pas préparer davantage. Cela sert à gagner du temps. Utilisez Brify pour séparer ordre du jour, décisions, points ouverts et questions avant la réunion.",
  },
  {
    koSlug: "organize-meeting-decisions-action-items",
    slug: "organiser-decisions-actions-reunion",
    title: "Comment organiser les décisions et actions après une réunion",
    excerpt:
      "Après une réunion, séparez décisions, points ouverts, responsables, échéances et prochaines actions au lieu de garder seulement une longue transcription.",
    seo_keywords: ["organiser décisions réunion", "actions réunion", "organisation après réunion", "structure compte rendu réunion", ...commonKeywords],
    intro:
      "Un long compte rendu ne garantit pas une bonne exécution. Souvent, tout ce qui a été discuté est écrit, mais il reste difficile de savoir qui doit faire quoi et pour quand. Le but de l'organisation après réunion n'est pas de conserver chaque phrase. C'est de rendre l'exécution stable après la réunion.",
    sections: [
      {
        heading: "Pourquoi les longs comptes rendus échouent encore",
        paragraphs: [
          "Un compte rendu peut contenir contexte, opinions, objections, idées temporaires, blagues et décisions ensemble. Dans cette forme, les actions sont difficiles à retrouver plus tard.",
          "Après une réunion, le compte rendu complet et la structure d'exécution doivent être séparés. Tout ce qui a été dit n'a pas la même importance.",
        ],
      },
      {
        heading: "Séparer décisions et discussion",
        paragraphs: [
          "Commencez par extraire ce qui a réellement été décidé. Discuté et décidé ne sont pas la même chose. Les décisions deviennent le point de référence des actions futures.",
          "Les opinions non résolues doivent rester comme points ouverts ou éléments de suivi, pas être écrites comme des décisions.",
        ],
      },
      {
        heading: "Garder visibles points ouverts et informations manquantes",
        paragraphs: [
          "Les points non résolus restent importants. Mais s'ils sont écrits comme des décisions, la confusion suit.",
          "Pour chaque point ouvert, notez pourquoi il reste ouvert, quelle information manque et qui doit la vérifier.",
        ],
      },
      {
        heading: "Ajouter responsable, échéance et prochaine étape",
        paragraphs: [
          "Une action ne suffit pas avec une simple phrase de tâche. Elle a besoin d'un responsable, d'une échéance et d'une condition de fin.",
          "Par exemple, 'recherche concurrentielle' est vague. 'Vérifier la nouvelle politique tarifaire de l'entreprise A avant mardi prochain et l'ajouter au tableau comparatif' est actionnable.",
        ],
      },
      {
        heading: "Créer une carte d'exécution après réunion dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez structurer le contenu de réunion en décisions, points ouverts, informations manquantes, responsables, échéances et actions.",
          "Avec cette structure, la prochaine action et la responsabilité restent visibles sans relire tout le compte rendu.",
        ],
      },
    ],
    closing:
      "L'organisation après réunion concerne l'exécution, pas seulement l'archivage. Utilisez Brify pour séparer décisions et actions afin que le travail suivant soit immédiatement visible.",
  },
  {
    koSlug: "turn-research-and-meetings-into-action-plan",
    slug: "transformer-recherche-reunions-plan-action",
    title: "Comment transformer étude de marché et documents de réunion en plan d'action",
    excerpt:
      "Pour transformer recherche et réunions en action, reliez insights, décisions, hypothèses, responsables, échéances et indicateurs de réussite.",
    seo_keywords: ["organisation recherche business", "structure document professionnel", "organisation résultats recherche", "organisation plan d'action", ...commonKeywords],
    intro:
      "Parfois, le rapport d'étude de marché est organisé et les documents de réunion le sont aussi, mais le travail n'avance pas. La raison est que les insights de recherche et les décisions de réunion restent stockés séparément. Le but final de l'organisation de recherche business n'est pas une belle synthèse, mais la prochaine action réellement exécutable.",
    sections: [
      {
        heading: "Pourquoi des documents organisés ne mènent pas toujours à l'exécution",
        paragraphs: [
          "Les documents de recherche sont souvent organisés autour des insights, tandis que les documents de réunion le sont autour de l'ordre du jour et des décisions. S'ils ne sont pas reliés, même une bonne recherche et une bonne réunion peuvent ne pas devenir un plan d'action.",
          "Un plan d'action a besoin non seulement de ce que vous avez appris, mais aussi de ce qui sera fait, par qui et quand ce sera vérifié.",
        ],
      },
      {
        heading: "Relier insights de recherche et décisions de réunion",
        paragraphs: [
          "Un insight de recherche doit être relié à la décision qu'il a influencée. Si l'analyse des segments clients a conduit à choisir une cible, ce lien doit être visible.",
          "Sans ce lien, les équipes oublient plus tard pourquoi une décision a été prise et répètent la même discussion.",
        ],
      },
      {
        heading: "Transformer les insights en hypothèses, responsables, échéances et indicateurs",
        paragraphs: [
          "Un plan d'action demande une étape où les insights deviennent des hypothèses. Par exemple, si les clients veulent plus de structure qu'un résumé rapide, l'hypothèse peut être que l'ajout d'exemples de cartes de structure sur la page d'accueil améliore la conversion.",
          "Ensuite, ajoutez un responsable, une échéance et un indicateur. C'est ce qui transforme la recherche en expérimentation ou en tâche.",
        ],
      },
      {
        heading: "Laisser des points de vérification pour la prochaine réunion",
        paragraphs: [
          "Un plan d'action n'est pas un document créé une fois puis oublié. Il doit aussi indiquer ce qui sera vérifié à la prochaine réunion.",
          "Avancement, évolution des indicateurs, informations manquantes et décisions suivantes doivent être visibles avant la prochaine discussion.",
        ],
      },
      {
        heading: "Construire une carte de plan d'action dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez relier insights de recherche, décisions de réunion, hypothèses d'exécution, responsables, échéances et indicateurs dans une seule structure.",
          "Quand étude de marché et documents de réunion deviennent un flux d'exécution, l'organisation des documents a plus de chances de produire un vrai progrès.",
        ],
      },
    ],
    closing:
      "La fin de l'organisation de recherche business n'est pas une synthèse. C'est l'exécution. Utilisez Brify pour relier insights, décisions, hypothèses, responsables et échéances dans un plan qui avance.",
  },
];

async function getKoreanSource(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,slug,translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.koSlug)
    .single();
  if (error) throw error;
  return data;
}

async function getExistingFrenchPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "fr")
    .eq("slug", post.slug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

const results = [];

for (const post of posts) {
  const source = await getKoreanSource(post);
  const existing = await getExistingFrenchPost(post);
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
    translation_group_id: source.translation_group_id,
  };

  if (existing?.id) {
    const { data, error } = await supabase
      .from("blog_posts")
      .update(payload)
      .eq("id", existing.id)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "updated", koSlug: source.slug, ...data });
  } else {
    const { data, error } = await supabase
      .from("blog_posts")
      .insert(payload)
      .select("id,locale,slug,title,status,seo_keywords,translation_group_id,updated_at")
      .single();
    if (error) throw error;
    results.push({ action: "created", koSlug: source.slug, ...data });
  }
}

console.log(JSON.stringify({ count: results.length, results }, null, 2));
