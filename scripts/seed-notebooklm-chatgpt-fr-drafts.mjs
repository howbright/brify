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
  "alternative NotebookLM",
  "limites résumé ChatGPT",
  "outil résumé article IA",
  "structuration article scientifique",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Comment transformer cela en carte de structure dans Brify",
    `Pour utiliser ${post.seo_keywords[0]} dans un vrai flux de travail, ne considérez pas une réponse ou un résumé généré par IA comme un résultat final. NotebookLM et ChatGPT peuvent aider à comprendre rapidement un contenu, mais les articles scientifiques et les documents d'étude doivent souvent être vérifiés, comparés, réécrits, présentés ou réutilisés plus tard.`,
    "Dans Brify, vous pouvez organiser le contenu avec des noeuds comme question de recherche, idée principale, méthode, résultats, preuves, limites, points à vérifier et usage prévu. Cette structure facilite le retour à la source, la comparaison de plusieurs articles avec les mêmes critères et la conservation de la logique derrière un résumé fluide.",
    "Pour un résumé d'article scientifique, un paragraphe naturel ne suffit pas. Il faut savoir quelle partie de la source soutient une affirmation, quelles conditions limitent la conclusion et si le résumé sert réellement votre devoir, rapport, présentation ou question de recherche.",
    "## Quand une carte de structure devient plus importante",
    "Une carte de structure devient particulièrement utile quand vous avez un résumé IA mais ne savez plus d'où vient la preuve, quand plusieurs articles se mélangent, ou quand vous devez expliquer le contenu dans un rapport ou une présentation alors que vous n'avez qu'un paragraphe de résumé.",
    "Elle est aussi utile lorsque les réponses de NotebookLM ou ChatGPT sont copiées à différents endroits. Utiliser plus d'outils IA ne crée pas automatiquement un meilleur flux de travail. Ce qui compte, c'est de rassembler les résultats dans une structure que vous pouvez relire et réutiliser.",
    "## Checklist rapide",
    `Si vous vérifiez ${post.seo_keywords[0]} aujourd'hui, posez quatre questions: quelle est la question centrale, la conclusion générée par IA est-elle reliée à une preuve source, la méthode et les limites restent-elles visibles, et le contenu peut-il être réutilisé pour écrire, étudier ou présenter ?`,
    "Si ces quatre éléments ne sont pas clairs, le résumé existe peut-être, mais l'organisation n'est pas terminée. Transformer le résultat en carte de structure Brify relie compréhension rapide, vérification, comparaison et réutilisation.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "notebooklm-alternative-checklist",
    slug: "alternative-notebooklm-criteres",
    title: "Vous cherchez une alternative à NotebookLM ? Les critères à vérifier",
    excerpt:
      "Pour choisir une alternative à NotebookLM, vérifiez qualité du résumé, édition de structure, sources, gestion de plusieurs documents et réutilisation.",
    seo_keywords: ["alternative NotebookLM", "application comme NotebookLM", "outil IA organisation articles", "alternative NotebookLM recherche", ...commonKeywords],
    intro:
      "Chercher une alternative à NotebookLM ne consiste pas seulement à trouver un outil avec des fonctions similaires. Les utilisateurs qui connaissent déjà NotebookLM veulent souvent savoir si leurs documents peuvent être organisés, modifiés, vérifiés et réutilisés dans un meilleur flux de travail.",
    sections: [
      { heading: "Pourquoi chercher une alternative à NotebookLM", paragraphs: ["NotebookLM est utile pour ajouter des sources, poser des questions et comprendre rapidement un contenu.", "Mais si vous devez modifier la structure vous-même, comparer plusieurs sources avec les mêmes critères ou réutiliser le contenu plus tard, un autre type de flux peut être nécessaire."] },
      { heading: "Compréhension rapide ou gestion de structure", paragraphs: ["La compréhension rapide aide à saisir le contenu maintenant.", "La gestion de structure aide à réutiliser ce contenu plus tard pour un rapport, une revue de littérature, un devoir, une présentation ou des notes de recherche."] },
      { heading: "Pouvez-vous vérifier les preuves originales ?", paragraphs: ["Pour les articles scientifiques et les documents professionnels, un résumé seul suffit rarement.", "Il faut voir quelle preuve soutient quelle affirmation et pouvoir revenir à la source quand le résumé doit être vérifié."] },
      { heading: "Pouvez-vous comparer plusieurs sources ?", paragraphs: ["Comprendre une source et comparer plusieurs sources sont deux problèmes différents.", "Au-delà de la qualité du résumé, demandez si l'outil aide à accumuler et comparer les informations de façon structurée."] },
      { heading: "Quand Brify est adapté", paragraphs: ["Si votre objectif principal est une réponse rapide, NotebookLM peut suffire.", "Si vous voulez éditer la structure, garder preuves et limites visibles et réutiliser le contenu, Brify peut mieux convenir."] },
    ],
    closing:
      "Une alternative à NotebookLM doit correspondre à votre manière d'organiser la connaissance, pas seulement offrir plus de fonctions. Brify est conçu pour l'étape après le premier résumé.",
  },
  {
    koSlug: "notebooklm-vs-brify",
    slug: "notebooklm-vs-brify",
    title: "NotebookLM ou Brify : quelle différence ?",
    excerpt:
      "Comparez NotebookLM et Brify selon compréhension rapide, édition de structure, vérification des sources, organisation d'articles et réutilisation.",
    seo_keywords: ["NotebookLM vs Brify", "alternative NotebookLM", "comparaison NotebookLM", "comparatif outils notes IA", ...commonKeywords],
    intro:
      "NotebookLM et Brify peuvent tous deux aider avec des documents longs, mais leurs objectifs sont différents. NotebookLM est fort pour comprendre vite des sources et poser des questions. Brify transforme le contenu en structure que vous pouvez modifier, gérer et réutiliser.",
    sections: [
      { heading: "Ce que NotebookLM fait bien", paragraphs: ["NotebookLM est utile pour poser des questions à partir de sources importées.", "Il aide à comprendre rapidement le fil général d'un document ou d'un article inconnu."] },
      { heading: "Ce que Brify privilégie", paragraphs: ["Brify se concentre moins sur la réponse instantanée que sur la conservation du contenu sous forme de carte de structure.", "Il organise questions, idées, preuves, exemples, limites et actions dans une structure visible."] },
      { heading: "Quand résumé et questions-réponses ne suffisent pas", paragraphs: ["Les résumés et les réponses sont rapides, mais peuvent se disperser quand vous revenez au contenu plus tard.", "Pour plusieurs articles ou de longs rapports, la structure doit souvent durer plus longtemps que la réponse."] },
      { heading: "Les flux de recherche qui ont besoin d'une structure", paragraphs: ["Revue de littérature, comparaison d'articles, rédaction de rapport et préparation de présentation demandent une structure réutilisable.", "Vous devez non seulement comprendre le contenu, mais aussi suivre les preuves et les relier à votre travail."] },
      { heading: "Comment utiliser les deux ensemble", paragraphs: ["Vous pouvez utiliser NotebookLM pour une première compréhension, puis déplacer les éléments importants dans Brify sous forme de carte de structure.", "Cela combine compréhension rapide et organisation durable."] },
    ],
    closing:
      "NotebookLM et Brify ne sont pas seulement concurrents. Ils correspondent à des étapes différentes. Brify est plus fort quand la compréhension doit devenir une structure réutilisable.",
  },
  {
    koSlug: "chatgpt-paper-summary-limitations",
    slug: "limites-resume-chatgpt-article-scientifique",
    title: "D'où viennent les limites de ChatGPT pour résumer un article scientifique ?",
    excerpt:
      "Les limites du résumé ChatGPT viennent souvent des preuves manquantes, méthodes compressées, conditions oubliées et conclusions trop fortes.",
    seo_keywords: ["limites résumé ChatGPT article scientifique", "erreurs résumé ChatGPT", "limites résumé IA article", "vérification résumé article", ...commonKeywords],
    intro:
      "ChatGPT peut résumer rapidement un article scientifique, mais un résumé d'article demande plus qu'un texte fluide. Ce qui compte est de savoir si la question de recherche, la méthode, les résultats, les preuves et les limites restent exacts et visibles.",
    sections: [
      { heading: "Pourquoi les résumés ChatGPT sont pratiques", paragraphs: ["ChatGPT peut raccourcir un long article et aider à comprendre l'orientation générale d'un sujet inconnu.", "Comme première lecture avant une analyse plus profonde, il peut être utile."] },
      { heading: "Les preuves sources peuvent disparaître", paragraphs: ["Un résumé ne montre pas toujours d'où vient chaque affirmation dans l'article original.", "Si vous voulez citer l'article ou l'utiliser dans un rapport, il faut pouvoir revenir aux preuves."] },
      { heading: "Méthodes et conditions peuvent être trop compressées", paragraphs: ["ChatGPT peut raccourcir des détails méthodologiques importants.", "Or dans un article scientifique, données, protocole et conditions sont souvent aussi importants que la conclusion."] },
      { heading: "Les conclusions peuvent sembler trop fortes", paragraphs: ["Un résumé IA peut transformer une formulation prudente en affirmation plus décisive.", "Une tendance, une possibilité ou un résultat limité peut paraître comme une conclusion ferme."] },
      { heading: "Relire le résumé comme une structure dans Brify", paragraphs: ["Dans Brify, vous pouvez diviser un résumé ChatGPT en question de recherche, preuves, méthode, résultats et limites.", "L'objectif est de transformer un résumé lisible en structure vérifiable."] },
    ],
    closing:
      "La principale limite de ChatGPT pour résumer un article n'est pas la brièveté. C'est la disparition possible de la structure et des preuves.",
  },
  {
    koSlug: "check-chatgpt-paper-summary",
    slug: "verifier-resume-chatgpt-apres-notebooklm",
    title: "Que vérifier après un résumé d'article scientifique par ChatGPT",
    excerpt:
      "Après un résumé d'article par ChatGPT, vérifiez question de recherche, méthode, résultats, limites et preuves avant de l'utiliser.",
    seo_keywords: ["vérifier résumé ChatGPT article", "contrôler résumé ChatGPT", "checklist résumé IA article", "vérification résumé scientifique", ...commonKeywords],
    intro:
      "Après avoir obtenu un résumé d'article par ChatGPT, il est tentant de l'enregistrer ou de l'utiliser immédiatement. Mais ce résumé est un brouillon. Il faut au minimum vérifier la question de recherche, la méthode, les résultats, les limites et les preuves sources.",
    sections: [
      { heading: "Vérifier la question de recherche", paragraphs: ["La première chose à contrôler est la question à laquelle l'article répond.", "Si cette question est mal comprise, la méthode et les résultats seront interprétés dans la mauvaise direction."] },
      { heading: "Vérifier méthode et conditions de données", paragraphs: ["Taille d'échantillon, jeu de données, conditions d'étude et méthode d'analyse limitent la conclusion.", "Si le résumé les compresse trop, revenez à l'article original."] },
      { heading: "Séparer résultats et interprétation", paragraphs: ["Les résultats réels et l'interprétation des auteurs doivent être distingués.", "Les résumés IA peuvent les fusionner en une seule conclusion."] },
      { heading: "Ne pas oublier limites et travaux futurs", paragraphs: ["Un bon résumé garde les limites visibles.", "Si elles disparaissent, le résultat peut sembler plus solide que ce que l'article soutient."] },
      { heading: "Garder la checklist dans Brify", paragraphs: ["Dans Brify, vous pouvez conserver la même checklist comme noeuds pour chaque article.", "Cette méthode devient plus utile à mesure que le nombre d'articles augmente."] },
    ],
    closing:
      "ChatGPT peut être un point de départ rapide. Pour vraiment utiliser un article, transformez le résumé en structure vérifiable dans Brify.",
  },
  {
    koSlug: "using-chatgpt-paper-summary-for-reports",
    slug: "utiliser-resume-chatgpt-rapport-risque",
    title: "Pourquoi ne pas utiliser directement un résumé ChatGPT dans un rapport",
    excerpt:
      "Avant d'utiliser un résumé ChatGPT dans un devoir ou rapport, vérifiez séparément sources, preuves, interprétation et points de citation.",
    seo_keywords: ["résumé ChatGPT pour rapport", "résumé IA devoir", "rapport résumé article", "limites ChatGPT rapport", ...commonKeywords],
    intro:
      "Un résumé d'article par ChatGPT peut sembler fluide et convaincant, mais l'utiliser directement dans un devoir, rapport ou exposé est risqué. L'important n'est pas que l'IA écrive un bon paragraphe, mais que vous compreniez l'article et puissiez montrer les preuves.",
    sections: [
      { heading: "Pourquoi les résumés IA sont risqués dans un devoir", paragraphs: ["Même un résumé fluide peut manquer de preuves sources claires.", "Dans un devoir basé sur des articles, chaque affirmation doit pouvoir se relier à une partie réelle du texte."] },
      { heading: "Vérifier sources et citations", paragraphs: ["Vous ne pouvez pas citer une phrase générée par IA comme si elle venait de l'article.", "Trouvez où l'idée apparaît dans la source et décidez s'il faut citer, paraphraser ou reformuler."] },
      { heading: "Séparer votre interprétation du texte IA", paragraphs: ["Un rapport doit inclure votre interprétation, pas seulement un résumé généré.", "Si votre jugement et le texte IA se mélangent, l'écriture devient difficile à défendre."] },
      { heading: "Reconstruire le résumé pour rapport ou présentation", paragraphs: ["Une présentation n'a pas besoin de suivre exactement l'ordre de l'article.", "Elle fonctionne souvent mieux avec problème, méthode, résultat, signification, limite et point de vue."] },
      { heading: "Utiliser Brify avant de rendre le travail", paragraphs: ["Une carte de structure Brify permet de vérifier affirmations, preuves et citations avant de rendre ou présenter.", "L'objectif est de transformer un résumé en structure que vous pouvez expliquer."] },
    ],
    closing:
      "Un résumé ChatGPT peut être une matière utile, mais il ne doit pas devenir le devoir lui-même. Structurez d'abord votre compréhension dans Brify.",
  },
  {
    koSlug: "notebooklm-for-graduate-students-limitations",
    slug: "notebooklm-doctorants-limites",
    title: "Quand NotebookLM peut ne pas suffire aux doctorants et étudiants en master",
    excerpt:
      "NotebookLM aide à comprendre vite des articles, mais comparaison, suivi des preuves et organisation des lacunes demandent parfois plus de structure.",
    seo_keywords: ["NotebookLM doctorants", "outil organisation articles doctorant", "NotebookLM articles scientifiques", "notes de recherche IA", ...commonKeywords],
    intro:
      "Pour les étudiants en master, doctorants et jeunes chercheurs, lire des articles ne consiste pas seulement à les comprendre une fois. Les articles doivent être réutilisés en rendez-vous, revue de littérature, projet de recherche ou rédaction. Les réponses rapides ne suffisent donc pas toujours.",
    sections: [
      { heading: "Pourquoi les étudiants cherchent NotebookLM", paragraphs: ["Il y a trop d'articles à lire et trop peu de temps.", "Comprendre vite le coeur d'un article et poser des questions est réellement utile."] },
      { heading: "Questions-réponses rapides ou notes de recherche", paragraphs: ["Les questions-réponses répondent au besoin du moment.", "Les notes de recherche doivent garder la place de l'article, ses preuves, ses limites et son lien avec votre propre travail."] },
      { heading: "Comparer avec les mêmes critères", paragraphs: ["Les étudiants avancés doivent souvent comparer plusieurs articles, pas seulement en comprendre un.", "Si question, méthode, données, résultats et limites ne sont pas organisés de la même façon, la comparaison devient difficile."] },
      { heading: "Garder lacunes et projet visibles", paragraphs: ["Dans une revue de littérature, il ne suffit pas de savoir ce que chaque article dit.", "Il faut aussi repérer les questions ouvertes et les relier à votre orientation de recherche."] },
      { heading: "Construire des cartes de comparaison dans Brify", paragraphs: ["Brify aide à organiser les articles avec la même structure et à les comparer dans le temps.", "Vous pouvez utiliser NotebookLM pour comprendre vite et Brify pour les notes de recherche durables."] },
    ],
    closing:
      "Les étudiants avancés ont besoin de plus que des réponses rapides. Ils ont besoin d'une structure de recherche accumulée. Brify garde comparaisons et lacunes visibles.",
  },
  {
    koSlug: "structure-map-for-multiple-papers",
    slug: "carte-structure-plusieurs-articles",
    title: "Pourquoi une carte de structure est essentielle quand on lit plusieurs articles",
    excerpt:
      "Quand vous lisez plusieurs articles, les résumés individuels ne suffisent pas. Organisez questions, méthodes, résultats, limites et différences.",
    seo_keywords: ["résumer plusieurs articles ChatGPT", "plusieurs résumés articles", "comparaison articles IA", "outil IA revue de littérature", ...commonKeywords],
    intro:
      "Résumer un article et comparer plusieurs articles sont deux tâches différentes. Même si ChatGPT résume bien chaque article, ces résultats restent difficiles à utiliser pour une revue de littérature s'ils ne suivent pas les mêmes critères.",
    sections: [
      { heading: "Pourquoi plusieurs résumés deviennent confus", paragraphs: ["Chaque article utilise des termes, méthodes, questions et formulations différentes.", "Si chaque résumé est sauvegardé séparément, vous devrez tout comparer à nouveau plus tard."] },
      { heading: "Des critères différents créent des problèmes", paragraphs: ["Un résumé peut se concentrer sur la méthode, un autre sur les résultats.", "Pour une revue de littérature, chaque article doit être vu dans le même cadre."] },
      { heading: "Utiliser le même cadre", paragraphs: ["Organisez chaque article avec des noeuds pour question de recherche, sujet, méthode, résultats et limites.", "Cela rend les ressemblances et différences plus faciles à voir."] },
      { heading: "Marquer différences et lacunes séparément", paragraphs: ["Le but d'une comparaison n'est pas de prouver que vous avez lu beaucoup.", "Il est de trouver la prochaine question. Les différences et lacunes doivent rester visibles."] },
      { heading: "Créer des cartes multi-articles dans Brify", paragraphs: ["Brify aide à organiser plusieurs articles avec la même logique de carte de structure.", "C'est plus réutilisable qu'une pile de résumés séparés."] },
    ],
    closing:
      "Quand vous lisez plusieurs articles, l'objectif n'est pas d'avoir plus de résumés. C'est d'obtenir une structure comparable et réutilisable.",
  },
  {
    koSlug: "ai-paper-summary-tool-for-notebooklm-alternative",
    slug: "choisir-outil-resume-article-ia",
    title: "Comment choisir un outil IA de résumé d'article scientifique",
    excerpt:
      "Pour choisir un outil IA de résumé d'article, vérifiez résumé, preuves sources, édition de structure, comparaison d'articles et export.",
    seo_keywords: ["outil résumé article IA", "résumeur article scientifique", "outil résumé article", "alternative NotebookLM", ...commonKeywords],
    intro:
      "Pour choisir un outil IA de résumé d'article scientifique, beaucoup regardent seulement si le résumé est court et naturel. Mais les articles demandent exactitude et réutilisation. Un bon outil doit aider à vérifier et structurer, pas seulement résumer.",
    sections: [
      { heading: "Pourquoi la qualité du résumé ne suffit pas", paragraphs: ["Un résumé naturel ne signifie pas toujours que l'article est bien compris.", "Si méthode, limites et preuves manquent, le résumé peut être beau mais difficile à utiliser."] },
      { heading: "Pouvez-vous retrouver preuves et sections ?", paragraphs: ["Les résumés d'articles doivent permettre de revenir à la source.", "Il faut savoir d'où viennent conclusions, conditions expérimentales et limites."] },
      { heading: "Pouvez-vous modifier la structure ?", paragraphs: ["Les résumés et catégories IA sont des brouillons.", "Vous devez pouvoir ajuster la structure selon votre objectif de recherche."] },
      { heading: "Peut-il comparer plusieurs articles ?", paragraphs: ["Beaucoup d'utilisateurs doivent comparer plusieurs articles plutôt qu'en résumer un.", "Vérifiez si l'outil organise plusieurs articles avec les mêmes critères."] },
      { heading: "Pourquoi Brify convient à la structuration", paragraphs: ["Brify centre le flux sur les cartes de structure plutôt que sur les paragraphes de résumé.", "Il aide à voir questions, méthodes, résultats, limites et usage prévu en un coup d'oeil."] },
    ],
    closing:
      "Un outil IA de résumé d'article doit laisser une structure vérifiable, pas seulement un résumé rapide. Brify organise le flux de recherche après le résumé.",
  },
  {
    koSlug: "notebooklm-chatgpt-paper-workflow",
    slug: "workflow-notebooklm-chatgpt-articles",
    title: "Pourquoi NotebookLM et ChatGPT ensemble peuvent encore laisser vos articles désorganisés",
    excerpt:
      "Même avec NotebookLM et ChatGPT, l'organisation échoue si résumés et réponses sont dispersés et qu'aucune structure réutilisable n'est créée.",
    seo_keywords: ["workflow NotebookLM ChatGPT articles", "comparaison NotebookLM ChatGPT", "organisation articles IA", "organisation documents recherche", ...commonKeywords],
    intro:
      "Utiliser NotebookLM et ChatGPT ensemble peut sembler puissant, mais cela peut aussi disperser vos documents de recherche. Si un outil donne des réponses, un autre reformule des résumés et les résultats sont sauvegardés séparément, la structure de recherche ne s'accumule jamais.",
    sections: [
      { heading: "Pourquoi utiliser NotebookLM et ChatGPT ensemble", paragraphs: ["NotebookLM est utile pour les questions basées sur des sources, tandis que ChatGPT aide à reformuler et restructurer du texte.", "Beaucoup d'utilisateurs combinent les deux pour comprendre les articles plus vite."] },
      { heading: "Les résumés et réponses se dispersent", paragraphs: ["Copier les réponses de plusieurs outils à différents endroits rend l'origine des idées difficile à suivre.", "Vous pouvez avoir plus de réponses, mais moins de structure."] },
      { heading: "Les questions restent, mais pas la structure", paragraphs: ["Vous pouvez vous souvenir de vos questions, mais la question de recherche, méthode, résultats et limites de l'article peuvent ne pas rester dans un cadre cohérent.", "Le centre de l'organisation doit être le contenu, pas la conversation avec l'outil."] },
      { heading: "Fusionner les sorties IA en structure unique", paragraphs: ["Quand les réponses NotebookLM et les résumés ChatGPT entrent dans une carte de structure, les répétitions et manques deviennent visibles.", "Vous pouvez aussi marquer les affirmations qui demandent une vérification source."] },
      { heading: "Utiliser Brify comme hub de structuration", paragraphs: ["Brify peut servir de hub pour organiser les sorties de plusieurs outils autour des questions, preuves, limites et usages prévus.", "Au lieu de collecter des réponses, rassemblez-les dans une structure utilisable."] },
    ],
    closing:
      "Utiliser beaucoup d'outils IA compte moins que gérer leurs résultats dans une structure unique. Brify rend cette structure visible et réutilisable.",
  },
  {
    koSlug: "organize-ai-paper-summaries",
    slug: "organiser-resumes-articles-ia",
    title: "Comment organiser des résumés d'articles IA quand tout reste confus",
    excerpt:
      "Si les résumés d'articles IA restent confus, restructurez-les par question de recherche, méthode, résultats, preuves, limites et usage.",
    seo_keywords: ["organiser résumés articles IA", "après résumé article organisation", "méthode organisation résumé IA", "outil structuration article", ...commonKeywords],
    intro:
      "Si l'IA a résumé un article mais que vos idées restent confuses, c'est normal. Un résumé réduit l'information, mais ne décide pas automatiquement comment comparer, expliquer, citer ou réutiliser cette information.",
    sections: [
      { heading: "Pourquoi les résumés IA restent parfois confus", paragraphs: ["Les résumés sont souvent écrits comme des paragraphes lisibles.", "Mais si question, preuves, méthode, résultats et limites ne sont pas séparés, le résumé reste difficile à utiliser."] },
      { heading: "Reconstruire autour de la question de recherche", paragraphs: ["Commencez par placer la question principale de l'article au centre.", "Divisez ensuite le résumé en question, méthode, résultats et limites."] },
      { heading: "Séparer méthode, résultats et limites", paragraphs: ["La méthode explique les conditions du résultat.", "Les limites montrent jusqu'où le résultat peut être utilisé. Sans elles, le résumé peut paraître trop optimiste."] },
      { heading: "Relier le résumé à votre objectif", paragraphs: ["Un résumé d'article est souvent gardé parce que vous voulez l'utiliser.", "Marquez ce qui servira à une présentation, ce qui soutiendra un rapport et ce qui doit être vérifié."] },
      { heading: "Transformer les résumés IA en cartes de recherche", paragraphs: ["Brify aide à réorganiser les résumés IA autour des questions, preuves, limites et usages prévus.", "Au lieu d'empiler des résumés, transformez-les en structures réellement utilisables."] },
    ],
    closing:
      "Après un résumé IA, l'étape suivante n'est pas plus de résumés. C'est une meilleure structure. Brify transforme les résumés d'articles en cartes de recherche.",
  },
];

async function getKoreanPost(post) {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("translation_group_id")
    .eq("locale", "ko")
    .eq("slug", post.koSlug)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function getExistingFrenchPost(translationGroupId, post) {
  const { data: byGroup, error: groupError } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "fr")
    .eq("translation_group_id", translationGroupId)
    .maybeSingle();
  if (groupError) throw groupError;
  if (byGroup) return byGroup;

  const { data: bySlug, error: slugError } = await supabase
    .from("blog_posts")
    .select("id,translation_group_id")
    .eq("locale", "fr")
    .eq("slug", post.slug)
    .maybeSingle();
  if (slugError) throw slugError;
  return bySlug;
}

const results = [];

for (const post of posts) {
  const koreanPost = await getKoreanPost(post);
  const translationGroupId = koreanPost?.translation_group_id ?? randomUUID();
  const existing = await getExistingFrenchPost(translationGroupId, post);
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
