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
  "résumé YouTube",
  "notes de vidéo de cours",
  "résumé de vidéo YouTube",
  "résumé vidéo IA",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Une méthode concrète",
    `Pour appliquer ${post.title.toLowerCase()} dans un vrai contexte de travail ou d'étude, commencez par ne plus traiter la vidéo comme quelque chose qu'il faut absolument regarder du début à la fin. Une vidéo avance dans le temps, mais une information utile doit être conservée par thème, question, concept, exemple et conclusion.`,
    "Définissez d'abord pourquoi vous résumez la vidéo. Est-ce pour étudier, préparer un rapport, collecter des idées, comparer des options ou comprendre rapidement l'essentiel ? Le but change ce qu'il faut garder.",
    "Parcourez ensuite le titre, la description, les chapitres et la transcription. Cherchez la question à laquelle la vidéo répond. Puis séparez l'idée principale ou le concept, les raisons, les exemples, les passages à revoir et les points à vérifier.",
    "Enfin, évitez de transformer toute la vidéo en longue note de transcription. Reconstruisez-la en structure que vous pourrez rechercher, revoir et réutiliser plus tard. C'est particulièrement important pour les longues vidéos et les vidéos de cours.",
    "## Comment le structurer dans Brify",
    `Dans Brify, vous pouvez organiser ${post.seo_keywords[0]} avec des noeuds comme objectif de la vidéo, question clé, concepts principaux, exemples importants, passages à revoir, points à vérifier et prochaines actions.`,
    "Cette méthode évite que la vidéo disparaisse dans un simple paragraphe. Vous voyez quelle est l'idée centrale, quel exemple l'explique, quel passage mérite d'être revu et comment la vidéo peut servir plus tard.",
    "Une carte de structure est aussi utile avec les résumés générés par IA. Même si le texte paraît fluide, la transcription peut contenir des erreurs, le contexte peut manquer, la conclusion peut être trop forte et certains exemples importants peuvent disparaître.",
    "## Les erreurs fréquentes",
    "La première erreur consiste à réduire toute la vidéo à un seul paragraphe. C'est pratique pour un aperçu rapide, mais insuffisant si vous devez retrouver des preuves, des exemples, des passages précis ou des notes de cours.",
    "La deuxième erreur consiste à faire trop confiance à la transcription. Les sous-titres automatiques peuvent mal reconnaître des noms, des termes techniques, des changements de locuteur ou le contexte.",
    "La troisième erreur consiste à résumer une vidéo de cours comme une vidéo YouTube générale. Une vidéo de cours demande concepts, définitions, exemples, questions de révision et points d'application.",
    "## Que faire aujourd'hui",
    `Si vous voulez commencer ${post.seo_keywords[0]} aujourd'hui, choisissez une vidéo et notez seulement trois choses: à quelle question répond-elle, quel passage faut-il revoir, et quelle partie peut réellement servir à votre travail ou à votre étude ?`,
    "Placez ensuite la question clé au centre d'une carte Brify et reliez autour d'elle les concepts, exemples, raisons et passages à revoir. L'objectif n'est pas de tout organiser parfaitement, mais de laisser une structure qui permet de retrouver le contexte.",
    "Organiser une vidéo ne consiste pas à sauvegarder plus de liens. Il s'agit de rendre les vidéos déjà vues à nouveau utiles.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-summarize-youtube-videos",
    slug: "comment-resumer-une-video-youtube",
    title: "Comment résumer rapidement une vidéo YouTube",
    excerpt:
      "Apprenez à résumer une vidéo YouTube en utilisant titre, transcription, idées principales, exemples et conclusion dans le bon ordre.",
    seo_keywords: ["résumé YouTube", "résumé vidéo YouTube", "résumer une vidéo YouTube", "résumé YouTube IA", ...commonKeywords],
    intro:
      "Vous n'avez pas toujours le temps de regarder toutes les vidéos YouTube jusqu'au bout, mais vous avez parfois besoin d'en comprendre l'essentiel. Un bon résumé YouTube ne se contente pas de raccourcir la vidéo: il garde l'idée principale, les raisons, les exemples et la conclusion.",
    sections: [
      { heading: "Quand un résumé YouTube devient utile", paragraphs: ["Les vidéos sauvegardées s'accumulent vite, mais peu sont réellement regardées en entier.", "Pour étudier, préparer un travail, trouver des idées ou comparer des options, comprendre le message central suffit souvent au départ."] },
      { heading: "Pourquoi le titre et la description ne suffisent pas", paragraphs: ["Les titres et miniatures servent souvent à attirer l'attention.", "La vraie conclusion, les preuves et les exemples utiles peuvent apparaître au milieu ou à la fin de la vidéo."] },
      { heading: "Utiliser la transcription pour voir le fil", paragraphs: ["La transcription est un bon point de départ pour résumer une vidéo YouTube.", "Cherchez les mots répétés, les transitions et les moments où la vidéo passe du contexte à l'argument."] },
      { heading: "Séparer idées, raisons et exemples", paragraphs: ["L'essentiel n'est pas de recopier tout ce qui est dit.", "Gardez l'idée principale, les raisons qui la soutiennent et les exemples qui l'expliquent dans des parties distinctes."] },
      { heading: "Créer une carte de résumé dans Brify", paragraphs: ["Brify permet d'organiser question clé, idée, raisons, exemples et passages à revoir.", "Cette structure se relit mieux qu'un simple paragraphe."] },
    ],
    closing:
      "Un résumé YouTube fait gagner du temps, mais il ne doit pas effacer la structure de la vidéo. Brify aide à garder l'idée et les preuves visibles.",
  },
  {
    koSlug: "summarize-long-youtube-videos",
    slug: "resumer-longue-video-youtube",
    title: "Comment résumer une longue vidéo YouTube",
    excerpt:
      "Résumez une longue vidéo YouTube en séparant déroulé, chapitres, idées répétées, exemples importants et conclusion.",
    seo_keywords: ["résumé longue vidéo YouTube", "résumer longue vidéo", "résumé vidéo YouTube", "résumé longue vidéo", ...commonKeywords],
    intro:
      "Une vidéo YouTube de 30 minutes, une heure ou deux heures ne se traite pas comme un seul bloc. Avant de la résumer, il faut la diviser en parties et distinguer l'information utile des répétitions.",
    sections: [
      { heading: "Pourquoi les longues vidéos sont difficiles à résumer", paragraphs: ["Les points clés, les histoires, les exemples et les répétitions se mélangent.", "Sans structure, il devient difficile de savoir ce qu'il faut vraiment garder."] },
      { heading: "Diviser la vidéo avant de la résumer", paragraphs: ["Une longue vidéo ne doit pas être réduite immédiatement à un seul résumé.", "Séparez introduction, problème, explication, exemples et conclusion."] },
      { heading: "Distinguer répétition et nouvelle information", paragraphs: ["Un intervenant répète souvent la même idée avec d'autres mots.", "La répétition peut signaler l'importance, mais elle doit être séparée des informations nouvelles."] },
      { heading: "Séparer exemples importants et anecdotes", paragraphs: ["Les exemples aident à comprendre, mais toutes les histoires n'ont pas la même valeur.", "Gardez les exemples qui éclairent le concept central."] },
      { heading: "Cartographier le fil dans Brify", paragraphs: ["Brify permet de découper la vidéo en sections et de marquer les passages à revoir.", "Pour une longue vidéo, cette structure est plus utile qu'un court résumé."] },
    ],
    closing:
      "Une longue vidéo YouTube doit être divisée avant d'être raccourcie. Brify aide à garder les sections clés et les passages à revoir.",
  },
  {
    koSlug: "organize-lecture-videos-into-notes",
    slug: "transformer-video-cours-en-notes",
    title: "Comment transformer une vidéo de cours en notes d'étude",
    excerpt:
      "Transformez une vidéo de cours en notes en organisant concepts, définitions, exemples, formules, questions et points de révision.",
    seo_keywords: ["notes de vidéo de cours", "organiser vidéo de cours", "notes de cours en ligne", "résumé vidéo de cours", ...commonKeywords],
    intro:
      "Une vidéo de cours est différente d'une vidéo YouTube générale. Elle ne sert pas seulement à comprendre vite: elle doit aider à mémoriser, réviser, expliquer et appliquer les idées.",
    sections: [
      { heading: "Ce qui rend une vidéo de cours différente", paragraphs: ["Dans une vidéo générale, l'idée principale et la conclusion peuvent suffire.", "Dans une vidéo de cours, il faut aussi garder l'ordre des concepts, définitions, exemples et applications."] },
      { heading: "Séparer concepts et exemples", paragraphs: ["Les cours mélangent souvent explications de concepts et exemples.", "Dans vos notes, placez le concept d'abord, puis reliez les exemples dessous."] },
      { heading: "Marquer définitions, formules et procédures", paragraphs: ["Ces éléments doivent être retrouvés rapidement plus tard.", "Ne les laissez pas disparaître dans de longs paragraphes."] },
      { heading: "Transformer les zones floues en questions", paragraphs: ["De bonnes notes gardent aussi ce qui n'est pas encore compris.", "Une question claire donne une cible à la prochaine révision."] },
      { heading: "Construire les notes dans Brify", paragraphs: ["Brify relie objectifs d'apprentissage, concepts, exemples, questions et points de révision.", "Vous pouvez retrouver le fil du cours sans revoir toute la vidéo."] },
    ],
    closing:
      "Les notes de vidéo de cours doivent soutenir la révision, pas seulement capturer des phrases. Brify aide à relier concepts, exemples et questions.",
  },
  {
    koSlug: "summarize-youtube-lectures-for-review",
    slug: "resumer-cours-youtube-pour-reviser",
    title: "Comment résumer un cours YouTube pour réviser",
    excerpt:
      "Résumez un cours YouTube pour la révision en structurant objectifs, concepts, exemples, exercices et passages confus.",
    seo_keywords: ["résumé cours YouTube", "réviser vidéo de cours", "notes cours YouTube", "notes de révision cours", ...commonKeywords],
    intro:
      "YouTube contient beaucoup de bons cours, mais sauvegarder une vidéo ne signifie pas l'étudier. Un résumé utile pour réviser doit garder l'ordre des concepts et leurs relations.",
    sections: [
      { heading: "Ce qu'un résumé de révision doit faire", paragraphs: ["Un résumé rapide aide à comprendre l'idée générale.", "Un résumé de révision doit aider à se souvenir et à appliquer les concepts."] },
      { heading: "Trouver l'objectif du cours", paragraphs: ["Notez d'abord ce que vous devriez comprendre à la fin.", "Placez ensuite les concepts essentiels dans l'ordre nécessaire."] },
      { heading: "Relier exemples et explications", paragraphs: ["Un exemple isolé devient vite inutile.", "Reliez chaque exemple au concept qu'il explique."] },
      { heading: "Marquer les passages confus", paragraphs: ["Les points les plus importants à revoir sont souvent ceux qui restent flous.", "Gardez les questions et les passages à revoir séparément."] },
      { heading: "Créer une carte de révision dans Brify", paragraphs: ["Brify relie objectifs, concepts, exemples et questions.", "Lors de la révision, vous pouvez commencer par les points faibles."] },
    ],
    closing:
      "Un résumé de cours YouTube doit redevenir utile au moment de réviser. Brify aide à conserver une structure compréhensible.",
  },
  {
    koSlug: "why-structure-video-content",
    slug: "pourquoi-structurer-contenu-video",
    title: "Pourquoi structurer une vidéo comme un document",
    excerpt:
      "Structurer une vidéo aide à rechercher, réviser, partager, présenter et réutiliser le contenu mieux qu'un simple résumé.",
    seo_keywords: ["organisation contenu vidéo", "structurer contenu vidéo", "notes vidéo YouTube", "méthode résumé vidéo", ...commonKeywords],
    intro:
      "Une vidéo avance dans le temps, mais nous ne réutilisons pas l'information dans cet ordre. Plus tard, ce qui compte est le thème, l'idée, l'exemple ou la conclusion à retrouver.",
    sections: [
      { heading: "Pourquoi une vidéo est difficile à retrouver", paragraphs: ["Un document se cherche et se parcourt plus facilement qu'une vidéo.", "Si vous ne vous souvenez pas des mots exacts, retrouver le bon passage prend du temps."] },
      { heading: "Les limites d'un résumé chronologique", paragraphs: ["Un résumé chronologique montre ce qui vient avant ou après.", "Pour réutiliser la vidéo, il faut souvent réorganiser par thèmes et idées."] },
      { heading: "Reconstruire par thème et exemple", paragraphs: ["Quand les points sont regroupés par thème, la vidéo devient plus exploitable.", "Les exemples, objections et conclusions se comparent plus facilement."] },
      { heading: "Rendre la vidéo recherchable", paragraphs: ["Mots-clés, questions, passages et objectifs rendent les notes vidéo plus faciles à retrouver.", "Une note structurée dure plus longtemps qu'un lien sauvegardé."] },
      { heading: "Structurer la vidéo dans Brify", paragraphs: ["Brify transforme le contenu vidéo en carte plutôt qu'en résumé plat.", "Les relations deviennent visibles pour réviser, partager ou préparer un rapport."] },
    ],
    closing:
      "Les vidéos passent, mais les connaissances utiles doivent rester structurées. Brify transforme le contenu vidéo en ressource retrouvable.",
  },
  {
    koSlug: "check-ai-youtube-summaries",
    slug: "verifier-resume-youtube-ia",
    title: "Que vérifier avec un résumé YouTube par IA",
    excerpt:
      "Avec un résumé YouTube par IA, vérifiez erreurs de transcription, contexte manquant, conclusions trop fortes et exemples oubliés.",
    seo_keywords: ["résumé YouTube IA", "IA résumé YouTube", "outil résumé YouTube", "résumé vidéo IA", ...commonKeywords],
    intro:
      "Les résumés YouTube par IA sont rapides, mais la rapidité ne garantit pas l'exactitude. Erreurs de transcription, contexte manquant, exemples oubliés et conclusions trop fortes peuvent modifier le sens.",
    sections: [
      { heading: "Ce que l'IA fait bien", paragraphs: ["L'IA repère vite les thèmes répétés et le fil général d'une transcription longue.", "Elle aide à comprendre la direction d'une vidéo avant de la regarder entièrement."] },
      { heading: "Vérifier les erreurs de transcription", paragraphs: ["Beaucoup de résumés IA dépendent des sous-titres.", "Si les noms, chiffres ou termes techniques sont mal reconnus, le résumé peut reprendre l'erreur."] },
      { heading: "Repérer le contexte et les exemples manquants", paragraphs: ["Le ton, les visuels, les plaisanteries et les exemples portent souvent une partie du sens.", "Un résumé textuel peut les ignorer."] },
      { heading: "Contrôler les conclusions trop affirmées", paragraphs: ["L'IA peut rendre une phrase prudente plus catégorique.", "Comparez avec le passage original avant de vous appuyer sur une conclusion forte."] },
      { heading: "Vérifier dans Brify", paragraphs: ["Brify sépare sortie IA, passages importants, exemples et points à vérifier.", "Le résumé devient plus facile à corriger et à utiliser."] },
    ],
    closing:
      "Un résumé YouTube par IA est un bon départ, pas une version finale. Brify aide à le vérifier avec la structure de la vidéo.",
  },
  {
    koSlug: "extract-key-concepts-from-lecture-videos",
    slug: "extraire-concepts-cles-video-cours",
    title: "Comment extraire les concepts clés d'une vidéo de cours",
    excerpt:
      "Extrayez les concepts clés d'une vidéo de cours en séparant définitions, exemples, contre-exemples, applications et questions.",
    seo_keywords: ["organisation notes de cours", "concepts clés vidéo de cours", "notes de concepts", "notes d'étude", ...commonKeywords],
    intro:
      "Après une vidéo de cours, on peut avoir l'impression d'avoir beaucoup entendu sans pouvoir l'expliquer clairement. C'est souvent parce que concepts, exemples, contre-exemples et applications sont mélangés.",
    sections: [
      { heading: "Pourquoi les notes deviennent trop longues", paragraphs: ["Tout noter rallonge les notes sans les rendre plus claires.", "Sans séparation entre concept central et explication, la révision devient difficile."] },
      { heading: "Séparer concept central et explication", paragraphs: ["Un concept central aide à comprendre le reste du cours.", "L'explication le clarifie, mais ne doit pas être confondue avec lui."] },
      { heading: "Relier exemples et contre-exemples", paragraphs: ["Un exemple isolé est difficile à réutiliser.", "Reliez chaque exemple à la condition ou au concept qu'il montre."] },
      { heading: "Marquer les points utiles aux examens", paragraphs: ["Les notes doivent dépendre de l'usage futur.", "Signalez les notions probables, les cas utiles et les passages à réexpliquer."] },
      { heading: "Créer des notes conceptuelles dans Brify", paragraphs: ["Brify place un concept au centre et relie exemples, contre-exemples et questions.", "Cette structure est plus utile qu'une note linéaire."] },
    ],
    closing:
      "De bonnes notes gardent les relations, pas seulement les mots. Brify aide à relier concepts et exemples pour mieux comprendre plus tard.",
  },
  {
    koSlug: "youtube-transcript-summary-mistakes",
    slug: "erreurs-resume-transcription-youtube",
    title: "Les erreurs fréquentes quand on résume une transcription YouTube",
    excerpt:
      "Les résumés de transcription YouTube peuvent être affectés par sous-titres automatiques, confusion de locuteur, répétitions et contexte manquant.",
    seo_keywords: ["résumé transcription YouTube", "résumé script YouTube", "erreurs résumé transcription", "notes transcription vidéo", ...commonKeywords],
    intro:
      "Une transcription YouTube accélère le résumé, mais elle ne représente pas toute la vidéo. Les sous-titres automatiques et le langage parlé peuvent affaiblir le résultat.",
    sections: [
      { heading: "Pourquoi c'est pratique mais risqué", paragraphs: ["La transcription transforme la vidéo en texte facile à traiter.", "Mais expressions, visuels, emphase et contexte peuvent disparaître."] },
      { heading: "Vérifier les sous-titres automatiques", paragraphs: ["Ils peuvent mal reconnaître noms, mots étrangers, chiffres et termes techniques.", "Si l'erreur touche un mot clé, le sens change."] },
      { heading: "Enlever répétitions et remplissage", paragraphs: ["Les transcriptions contiennent souvent hésitations et phrases répétées.", "Un bon résumé garde le sens, pas toutes les habitudes de parole."] },
      { heading: "Préserver locuteur et contexte", paragraphs: ["Dans une interview ou un débat, savoir qui parle est essentiel.", "Sans contexte, opinions et objections se mélangent."] },
      { heading: "Restructurer dans Brify", paragraphs: ["Brify sépare idées, raisons, exemples et passages à vérifier.", "La transcription devient une structure plus claire."] },
    ],
    closing:
      "Une transcription YouTube est une matière première, pas un résumé final. Brify aide à la restructurer et à repérer les faiblesses.",
  },
  {
    koSlug: "find-important-parts-in-long-videos",
    slug: "trouver-passages-importants-longue-video",
    title: "Comment trouver les passages importants dans une longue vidéo",
    excerpt:
      "Trouvez les passages importants d'une longue vidéo avec titre, chapitres, transcription, mots répétés et recherche par question.",
    seo_keywords: ["résumé longue vidéo", "trouver passages importants YouTube", "passages clés vidéo", "résumé long cours", ...commonKeywords],
    intro:
      "Vous n'avez pas toujours besoin de regarder une longue vidéo entière. L'objectif n'est pas de réfléchir moins, mais de trouver le passage qui répond à votre question.",
    sections: [
      { heading: "Quand toute la vidéo n'est pas nécessaire", paragraphs: ["Avis produit, cours, interviews et webinaires concentrent souvent l'information utile dans certains passages.", "Avec un objectif clair, trouver la bonne section peut être plus efficace."] },
      { heading: "Commencer par la question", paragraphs: ["Avant de parcourir une longue vidéo, définissez ce que vous cherchez.", "Sans question, chaque section semble importante."] },
      { heading: "Utiliser chapitres et transcription", paragraphs: ["Chapitres, description et mots répétés donnent des indices.", "Ils indiquent où un sujet est développé."] },
      { heading: "Utiliser les mots répétés avec prudence", paragraphs: ["Un mot répété indique souvent un thème central.", "Mais il faut vérifier s'il se relie à une conclusion ou un exemple."] },
      { heading: "Garder les passages dans Brify", paragraphs: ["Brify permet de sauvegarder les passages importants avec leur raison.", "Associer timestamp et question accélère la révision."] },
    ],
    closing:
      "Pour trouver l'important dans une longue vidéo, commencez par une question. Brify garde les passages utiles et leur raison.",
  },
  {
    koSlug: "youtube-summary-tool-checklist",
    slug: "choisir-outil-resume-youtube",
    title: "Comment choisir un outil de résumé YouTube",
    excerpt:
      "Pour choisir un outil de résumé YouTube, vérifiez transcription, longues vidéos, retour à la source, structure, édition et partage.",
    seo_keywords: ["outil résumé YouTube", "outil résumé vidéo", "outil résumé vidéo IA", "outil résumé cours", ...commonKeywords],
    intro:
      "Il existe beaucoup d'outils de résumé YouTube, mais un bon outil ne se limite pas à produire un court paragraphe fluide. Il doit aider à vérifier, modifier, structurer et réutiliser le résultat.",
    sections: [
      { heading: "Ne pas juger seulement le texte", paragraphs: ["Un résumé fluide peut manquer le point principal.", "Cherchez une structure vérifiable, pas seulement de belles phrases."] },
      { heading: "Vérifier transcription et longues vidéos", paragraphs: ["Les outils dépendent fortement de la qualité de transcription.", "Pour les longues vidéos, le découpage et la gestion des répétitions comptent aussi."] },
      { heading: "Pouvoir revenir au flux original", paragraphs: ["Un résumé isolé est difficile à vérifier.", "Il faut pouvoir revenir aux chapitres, passages ou timestamps."] },
      { heading: "Édition et partage comptent", paragraphs: ["Un résumé est souvent un brouillon.", "Pour étudier, travailler ou préparer une réunion, il doit être modifiable et partageable."] },
      { heading: "Pourquoi Brify convient", paragraphs: ["Brify privilégie les cartes de structure aux résumés plats.", "Il garde résumé, vérifications et questions clés ensemble."] },
    ],
    closing:
      "Un outil de résumé YouTube doit aider à réutiliser la vidéo, pas seulement à la raccourcir. Brify aide à structurer et vérifier le résumé.",
  },
  {
    koSlug: "turn-lecture-videos-into-review-materials",
    slug: "transformer-video-cours-en-support-revision",
    title: "Comment transformer une vidéo de cours en support de révision",
    excerpt:
      "Transformez une vidéo de cours en support de révision avec concepts clés, points probables, questions, exemples et checklists.",
    seo_keywords: ["révision vidéo de cours", "support de révision cours", "révision cours en ligne", "étudier avec vidéo de cours", ...commonKeywords],
    intro:
      "Regarder une vidéo de cours une fois ne suffit pas à en faire un support de révision. Un bon support doit aider à expliquer, mémoriser et appliquer le contenu plus tard.",
    sections: [
      { heading: "Support de révision et résumé diffèrent", paragraphs: ["Un résumé aide à comprendre vite.", "Un support de révision aide à rappeler et utiliser le contenu."] },
      { heading: "Marquer les concepts importants", paragraphs: ["Les notions répétées ou soulignées sont souvent centrales.", "Définitions, comparaisons, procédures et conditions doivent être visibles."] },
      { heading: "Garder les questions sur les points faibles", paragraphs: ["Ne cachez pas les zones faibles.", "Si vous ne pouvez pas expliquer un concept, transformez-le en question."] },
      { heading: "Transformer les exemples en checklist", paragraphs: ["Les exemples peuvent devenir des guides pratiques étape par étape.", "Cela aide à appliquer le cours."] },
      { heading: "Créer une routine dans Brify", paragraphs: ["Brify relie concepts, questions, exemples et checklists.", "À la prochaine révision, commencez par les points faibles."] },
    ],
    closing:
      "Une vidéo de cours dure plus longtemps quand elle devient une structure de révision. Brify relie concepts, questions et checklists.",
  },
  {
    koSlug: "make-youtube-videos-searchable",
    slug: "rendre-videos-youtube-retrouvables",
    title: "Comment rendre des vidéos YouTube faciles à retrouver",
    excerpt:
      "Rendez vos vidéos YouTube retrouvables avec questions clés, mots-clés, passages, résumés, tags et usages.",
    seo_keywords: ["organisation contenu YouTube", "organiser vidéos YouTube sauvegardées", "gestion connaissances vidéo", "retrouver vidéos YouTube", ...commonKeywords],
    intro:
      "Sauvegarder une vidéo YouTube utile ne signifie pas sauvegarder la connaissance. Plus votre liste grandit, plus il faut une structure pour retrouver la bonne vidéo et le bon passage.",
    sections: [
      { heading: "Pourquoi les vidéos sauvegardées se perdent", paragraphs: ["Les playlists montrent surtout titres et miniatures.", "Elles ne gardent pas toujours pourquoi vous avez sauvegardé la vidéo ni quel passage comptait."] },
      { heading: "Garder la question clé", paragraphs: ["Quand vous sauvegardez une vidéo, notez la question à laquelle elle répond.", "Par exemple: quel problème cette vidéo m'aide-t-elle à résoudre ?"] },
      { heading: "Associer mots-clés et passages", paragraphs: ["Des mots-clés sans contexte sont faibles; des timestamps sans mots-clés sont difficiles à chercher.", "Gardez mots-clés, timestamps et courte explication ensemble."] },
      { heading: "Classer par usage", paragraphs: ["Étude, travail, inspiration et visionnage plus tard demandent des structures différentes.", "Le classement par objectif rend la bibliothèque plus utile."] },
      { heading: "Créer une carte vidéo dans Brify", paragraphs: ["Brify organise les vidéos par mots-clés, questions et usages.", "Plusieurs vidéos sur un même sujet peuvent devenir une carte de connaissances."] },
    ],
    closing:
      "Le but n'est pas de sauvegarder plus de vidéos YouTube. Le but est de retrouver celles qui comptent. Brify aide à créer une carte vidéo recherchable.",
  },
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
