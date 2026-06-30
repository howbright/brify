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

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Une méthode concrète",
    `Pour appliquer ${post.title.toLowerCase()} dans un vrai travail de recherche, commencez par rassembler les articles que vous avez déjà. Évitez de passer directement à la rédaction: transformez d'abord chaque article en informations comparables.`,
    "Formulez en une phrase la question à laquelle votre revue de littérature doit répondre. Séparez les articles qui soutiennent directement cette question de ceux qui servent seulement de contexte. Pour chaque article, notez la question de recherche, le terrain ou les données, la méthode, le résultat principal, la limite et le lien avec votre propre projet.",
    "Quand ces champs restent les mêmes d'un article à l'autre, des motifs apparaissent. Vous voyez quelles affirmations se répètent, quelles méthodes dominent, quels résultats se contredisent et où votre propre question de recherche peut trouver sa place.",
    "## Comment le structurer dans Brify",
    `Dans Brify, vous pouvez organiser ${post.seo_keywords[0]} autour de noeuds comme question de recherche, groupes d'articles, différences de méthode, différences de résultats, limites, lacunes de recherche et lien avec votre projet.`,
    "Le but n'est pas de créer une note isolée pour chaque article. Placez chaque article sous un thème, un débat, une méthode ou une lacune. Les articles qui défendent des idées proches peuvent rester ensemble. Les articles qui se contredisent peuvent former une branche séparée.",
    "Il est aussi utile de distinguer ce qui est déjà clair de ce qui doit encore être vérifié. Une revue de littérature ne se termine pas en une seule lecture. Elle devient plus solide par comparaison, correction et retour aux sources.",
    "## Les erreurs fréquentes",
    "La première erreur consiste à organiser les articles dans l'ordre où vous les avez lus. L'ordre de lecture n'est pas l'ordre logique d'une revue. Le lecteur veut comprendre comment le champ discute le problème, pas connaître votre parcours de lecture.",
    "La deuxième erreur consiste à donner le même poids à tous les articles. Dans une revue de littérature, certains textes sont centraux alors que d'autres servent surtout de contexte. Tout traiter au même niveau rend le texte plus long, mais pas forcément plus clair.",
    "La troisième erreur consiste à annoncer une lacune de recherche trop vite. Avant de dire qu'une question n'a pas été étudiée, vérifiez vos mots-clés, votre périmètre, les concepts voisins et les études proches. Une lacune doit s'appuyer sur des preuves.",
    "## Que faire aujourd'hui",
    `Si vous voulez commencer ${post.seo_keywords[0]} aujourd'hui, choisissez seulement trois articles et organisez-les avec les mêmes critères. Trois articles suffisent déjà à faire apparaître des thèmes récurrents, des manques et des différences importantes.`,
    "Ensuite, écrivez une phrase pour chaque article: pourquoi cet article compte-t-il pour ma question de recherche ? Si cette phrase est difficile à écrire, l'article n'est peut-être pas central. Si elle est claire, l'article mérite probablement une lecture plus approfondie et un suivi de ses citations.",
    "Commencer petit est suffisant. L'essentiel est que chaque séance de lecture laisse une structure qui aide la séance suivante et la future rédaction.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const commonKeywords = [
  "revue de littérature",
  "organisation recherche doctorant",
  "synthèse d'articles scientifiques",
  "carte de structure IA",
  "Brify",
];

const posts = [
  {
    koSlug: "how-to-start-literature-review",
    slug: "comment-commencer-une-revue-de-litterature",
    title: "Comment commencer une revue de littérature",
    excerpt:
      "Commencez une revue de littérature en délimitant le sujet, les mots-clés, les critères de sélection, les comparaisons et les lacunes de recherche.",
    seo_keywords: ["comment commencer une revue de littérature", "méthode revue de littérature", "recherche bibliographique", ...commonKeywords],
    intro:
      "Commencer une revue de littérature peut sembler très flou. Combien d'articles faut-il lire ? Quels textes faut-il garder ? Comment transformer des notes en argument ? Une revue de littérature n'est pas une liste d'articles lus. C'est une manière structurée de montrer dans quelle conversation scientifique votre projet s'inscrit.",
    sections: [
      {
        heading: "Pourquoi une revue de littérature paraît difficile",
        paragraphs: [
          "Une revue de littérature est difficile parce que chaque article pose une question légèrement différente, utilise une méthode différente et reconnaît des limites différentes.",
          "Si vous résumez les articles un par un sans comparer ces différences, le texte devient plus long mais le paysage de recherche reste flou.",
        ],
      },
      {
        heading: "Délimiter le sujet avant de lire partout",
        paragraphs: [
          "Ne commencez pas par un mot-clé trop large. Délimitez d'abord le public, le phénomène, la méthode et le contexte qui comptent réellement pour votre projet.",
          "Par exemple, 'IA dans l'éducation' est très large. 'Usage de l'IA générative dans les cours d'écriture universitaire' donne un périmètre plus clair.",
        ],
      },
      {
        heading: "Définir mots-clés et critères de sélection",
        paragraphs: [
          "Une bonne revue de littérature commence par une stratégie de recherche. Notez les mots-clés principaux, les synonymes, les expressions du domaine et les termes à exclure.",
          "Définissez ensuite les critères d'inclusion et d'exclusion: lien direct avec la question, méthode comparable, contexte pertinent, période étudiée.",
        ],
      },
      {
        heading: "Comparer les articles avec les mêmes critères",
        paragraphs: [
          "Pour chaque article, notez les mêmes éléments: question de recherche, population ou corpus, méthode, résultat, limite et lien avec votre projet.",
          "Cela permet d'expliquer un champ de recherche par ses tendances et ses lacunes, au lieu d'aligner des noms d'auteurs.",
        ],
      },
      {
        heading: "Construire le fil de la revue dans Brify",
        paragraphs: [
          "Brify peut vous aider à relier plusieurs articles dans une carte de structure. Au lieu d'empiler des résumés, vous pouvez séparer thèmes, débats, méthodes, limites et lacunes.",
          "Commencer par une carte rend la rédaction moins intimidante, car la logique de la revue est déjà visible.",
        ],
      },
    ],
    closing:
      "Une revue de littérature n'est pas une compétition de lecture. C'est une manière de comprendre une conversation scientifique. Utilisez Brify pour transformer une liste d'articles en carte structurée.",
  },
  {
    koSlug: "how-to-organize-prior-research",
    slug: "comment-organiser-les-travaux-anterieurs",
    title: "Comment organiser les travaux antérieurs pour une revue de littérature",
    excerpt:
      "Organisez les travaux antérieurs par thèmes, méthodes, résultats, limites et lacunes au lieu de produire une suite de résumés séparés.",
    seo_keywords: ["organiser travaux antérieurs", "synthèse bibliographique", "revue de littérature organisation", ...commonKeywords],
    intro:
      "Organiser les travaux antérieurs ne consiste pas à coller plusieurs résumés les uns après les autres. Le but est de montrer pourquoi votre question de recherche compte, en expliquant ce que les études existantes ont déjà établi et ce qu'elles laissent ouvert.",
    sections: [
      {
        heading: "Les travaux antérieurs ne sont pas de simples résumés",
        paragraphs: [
          "Un résumé compresse une étude. Une revue des travaux antérieurs compare plusieurs études et explique leur rapport avec votre projet.",
          "Chaque note devrait donc répondre à une question: que signifie cet article pour ma propre question de recherche ?",
        ],
      },
      {
        heading: "Regrouper les études par thème",
        paragraphs: [
          "Lister les articles par auteur affaiblit souvent la logique de la revue. Les sections fortes sont construites par thèmes, débats ou approches méthodologiques.",
          "Quand vous regroupez questions, méthodes et conclusions proches, la forme du champ devient plus lisible.",
        ],
      },
      {
        heading: "Comparer méthodes et résultats ensemble",
        paragraphs: [
          "Les résultats ont plus de sens lorsqu'ils restent liés aux méthodes. Une enquête, un entretien, une expérience ou une analyse de données ne soutiennent pas le même type d'affirmation.",
          "Si deux articles arrivent à des conclusions différentes, la méthode et le contexte expliquent souvent cette différence.",
        ],
      },
      {
        heading: "Repérer limites et lacunes",
        paragraphs: [
          "Les limites ne sont pas seulement des faiblesses. Elles indiquent où votre propre recherche peut contribuer.",
          "Limites répétées, populations peu étudiées, comparaisons absentes ou méthodes trop étroites peuvent devenir des candidates pour une lacune de recherche.",
        ],
      },
      {
        heading: "Structurer les travaux antérieurs avec Brify",
        paragraphs: [
          "Brify aide à organiser les travaux antérieurs par thèmes et relations, plutôt que par notes isolées.",
          "Cette structure peut devenir le pont entre la lecture des articles et la rédaction d'un projet, d'un mémoire ou d'une section de revue de littérature.",
        ],
      },
    ],
    closing:
      "Organiser les travaux antérieurs revient à construire des preuves pour votre question de recherche. Utilisez Brify pour cartographier le fil, les limites et les lacunes avant de rédiger.",
  },
  {
    koSlug: "why-literature-review-matrix-matters",
    slug: "pourquoi-une-matrice-de-revue-de-litterature-est-utile",
    title: "Pourquoi une matrice de revue de littérature est utile",
    excerpt:
      "Une matrice de revue de littérature aide à comparer questions de recherche, méthodes, résultats et limites entre plusieurs articles.",
    seo_keywords: ["matrice revue de littérature", "tableau comparatif articles scientifiques", "matrice bibliographique", ...commonKeywords],
    intro:
      "Une matrice de revue de littérature est un tableau qui permet de comparer plusieurs articles avec les mêmes critères. Ce n'est pas seulement un fichier administratif: c'est un outil pour voir les motifs, différences et lacunes dans les études.",
    sections: [
      {
        heading: "Ce qu'est une matrice de revue de littérature",
        paragraphs: [
          "Une matrice utile contient souvent auteur, année, question de recherche, population, méthode, résultats, limites et lien avec votre projet.",
          "Le point central est la cohérence: vous posez les mêmes questions à chaque article.",
        ],
      },
      {
        heading: "Ce qu'il faut mettre dans la matrice",
        paragraphs: [
          "Les informations bibliographiques ne suffisent pas. Ajoutez cadre théorique, méthode, données, résultat principal, limite et pistes de recherche futures.",
          "Vous pouvez aussi ajouter des champs propres à votre sujet, comme population cible, mesure utilisée ou unité d'analyse.",
        ],
      },
      {
        heading: "Pourquoi le tableau ne suffit pas",
        paragraphs: [
          "Une matrice est excellente pour comparer, mais elle montre mal le fil argumentatif. Les tableaux séparent l'information en lignes et colonnes, alors qu'une revue a besoin de relations.",
          "Après la matrice, il faut encore identifier les groupes, débats, désaccords et lacunes.",
        ],
      },
      {
        heading: "Voir les liens entre articles",
        paragraphs: [
          "Une fois la matrice faite, regroupez les articles qui posent des questions proches, utilisent des méthodes similaires ou obtiennent des résultats opposés.",
          "Ces liens transforment un tableau d'études en plan de revue de littérature.",
        ],
      },
      {
        heading: "Utiliser Brify avec la matrice",
        paragraphs: [
          "Vous pouvez déplacer les informations de la matrice dans Brify et les relier par thème, débat, méthode ou lacune.",
          "Si la matrice organise les données, Brify aide à voir la logique de revue que ces données construisent.",
        ],
      },
    ],
    closing:
      "Une matrice de revue de littérature ne prouve pas seulement que vous avez lu beaucoup d'articles. Elle sert à trouver des différences utiles. Brify peut transformer cette matrice en structure de revue.",
  },
  {
    koSlug: "why-grad-students-struggle-with-paper-notes",
    slug: "pourquoi-les-doctorants-ont-du-mal-avec-leurs-notes-darticles",
    title: "Pourquoi les doctorants ont du mal avec leurs notes d'articles",
    excerpt:
      "Les doctorants lisent beaucoup d'articles, mais peinent souvent à transformer leurs notes en revue de littérature structurée.",
    seo_keywords: ["notes articles doctorant", "organisation doctorant", "notes revue de littérature", ...commonKeywords],
    intro:
      "Les doctorants lisent beaucoup d'articles. Pourtant, après quelques semaines, il devient difficile de se rappeler pourquoi un article comptait, comment il se relie au projet et où il doit entrer dans la revue de littérature.",
    sections: [
      {
        heading: "Pourquoi lire davantage ne suffit pas",
        paragraphs: [
          "Le problème principal est souvent l'incohérence des notes. Un jour vous résumez l'abstract, un autre vous copiez une phrase, puis vous sauvegardez seulement le PDF.",
          "Ces notes s'accumulent, mais elles ne deviennent pas forcément un savoir de recherche réutilisable.",
        ],
      },
      {
        heading: "La limite des notes centrées sur le résumé",
        paragraphs: [
          "Les résumés sont utiles, mais insuffisants pour une revue de littérature. Il faut aussi voir les relations entre articles, les différences de méthode, les résultats opposés et les lacunes.",
          "Même de bons résumés échouent s'ils ne peuvent pas être comparés.",
        ],
      },
      {
        heading: "Relier chaque article à votre question",
        paragraphs: [
          "Après chaque lecture, notez comment l'article se relie à votre question: preuve directe, contexte, méthode, contre-argument ou document à exclure.",
          "Cette classification simple facilite beaucoup la sélection future.",
        ],
      },
      {
        heading: "Créer des critères de notes répétables",
        paragraphs: [
          "Un doctorant n'a pas seulement besoin d'une application de notes. Il a besoin de critères répétés.",
          "Utilisez à chaque fois les mêmes champs: question, méthode, résultat, limite et lien avec votre travail.",
        ],
      },
      {
        heading: "Construire des notes cumulatives dans Brify",
        paragraphs: [
          "Brify peut transformer les notes d'articles en carte de structure qui grandit avec le temps.",
          "Quand les articles sont organisés avec la même logique, la revue de littérature devient beaucoup plus facile à assembler.",
        ],
      },
    ],
    closing:
      "Lire beaucoup d'articles compte moins que les comparer avec les mêmes questions. Utilisez Brify pour transformer des notes dispersées en carte de recherche.",
  },
  {
    koSlug: "how-to-find-research-gap",
    slug: "comment-trouver-une-lacune-de-recherche",
    title: "Comment trouver une lacune de recherche dans une revue de littérature",
    excerpt:
      "Trouvez une lacune de recherche en comparant sujets, populations, méthodes, données, résultats et limites des études existantes.",
    seo_keywords: ["comment trouver une lacune de recherche", "lacune de recherche", "research gap revue de littérature", ...commonKeywords],
    intro:
      "Une lacune de recherche n'est pas une idée qui apparaît par hasard. Elle émerge quand vous comparez les études existantes et repérez ce qui reste peu expliqué, peu étudié ou non résolu.",
    sections: [
      {
        heading: "Ce qu'est vraiment une lacune de recherche",
        paragraphs: [
          "Une lacune peut être une population absente, une méthode peu utilisée, une contradiction non résolue, un contexte trop étroit ou une question encore mal traitée.",
          "Il ne suffit pas de dire que personne ne l'a fait. Il faut expliquer pourquoi ce manque compte.",
        ],
      },
      {
        heading: "Comparer les limites des articles",
        paragraphs: [
          "Ne lisez pas les limites de chaque article séparément. Mettez-les côte à côte et cherchez les répétitions.",
          "Échantillons réduits, terrains limités à un pays, données à court terme ou mesures étroites peuvent indiquer des lacunes possibles.",
        ],
      },
      {
        heading: "Observer les différences de population et de méthode",
        paragraphs: [
          "Des populations ou méthodes différentes peuvent produire des conclusions différentes. Suivre ces différences aide à formuler de meilleures questions.",
          "Enquêtes, entretiens, expériences et données de plateforme révèlent chacun une partie différente du phénomène.",
        ],
      },
      {
        heading: "Repérer conclusions répétées et questions absentes",
        paragraphs: [
          "Si de nombreux articles répètent une conclusion similaire, demandez dans quelles conditions elle s'applique et où elle pourrait ne pas fonctionner.",
          "Si une question disparaît sans cesse de la littérature, cette absence peut devenir une lacune.",
        ],
      },
      {
        heading: "Cartographier les lacunes dans Brify",
        paragraphs: [
          "Brify permet de disposer limites, méthodes, populations et résultats côte à côte.",
          "Quand les différences deviennent visibles, les lacunes possibles sont plus faciles à évaluer.",
        ],
      },
    ],
    closing:
      "Les lacunes viennent des différences et limites de la recherche existante. Utilisez Brify pour les cartographier avant de choisir votre propre question.",
  },
  {
    koSlug: "literature-review-for-research-proposal",
    slug: "revue-de-litterature-pour-projet-de-recherche",
    title: "Préparer une revue de littérature pour un projet de recherche",
    excerpt:
      "Préparez une revue de littérature pour un projet de recherche en organisant les études existantes et en les reliant à votre question.",
    seo_keywords: ["revue de littérature projet de recherche", "travaux antérieurs mémoire", "projet de recherche doctorat", ...commonKeywords],
    intro:
      "La revue de littérature d'un projet de recherche n'est pas un rapport sur tout ce que vous avez lu. Elle montre pourquoi votre question est nécessaire, où en est le champ et ce qui reste non résolu.",
    sections: [
      {
        heading: "Le rôle de la revue dans un projet",
        paragraphs: [
          "La revue de littérature donne le contexte et la justification du projet. Un directeur ou un évaluateur y voit si vous comprenez le champ.",
          "Au lieu de lister des résumés, il faut montrer la conversation scientifique dans laquelle votre projet entre.",
        ],
      },
      {
        heading: "Construire d'abord le fil thématique",
        paragraphs: [
          "Avant de rédiger, construisez le fil des thèmes. Partez du champ large, puis descendez vers les débats précis et votre question.",
          "Quand ce fil est visible, il devient plus facile de choisir l'ordre des articles.",
        ],
      },
      {
        heading: "Organiser les limites des travaux existants",
        paragraphs: [
          "Un projet doit montrer ce que les recherches existantes ont apporté et ce qu'elles n'ont pas encore résolu.",
          "Séparez les limites par population, méthode, données, contexte et explication théorique.",
        ],
      },
      {
        heading: "Relier la revue à votre question",
        paragraphs: [
          "La fin de la revue doit conduire naturellement à votre question de recherche.",
          "Si ce lien est faible, la revue ressemble à une liste de lectures plutôt qu'à un argument de projet.",
        ],
      },
      {
        heading: "Planifier la structure avec Brify",
        paragraphs: [
          "Brify peut aider à cartographier travaux antérieurs, lacunes et question de recherche avant la rédaction.",
          "Voir la structure avant d'écrire rend le travail beaucoup moins bloquant.",
        ],
      },
    ],
    closing:
      "La revue de littérature d'un projet montre pourquoi votre recherche doit exister. Utilisez Brify pour concevoir le fil avant de le transformer en paragraphes.",
  },
  {
    koSlug: "prepare-papers-for-advisor-meeting",
    slug: "preparer-des-articles-pour-un-rendez-vous-avec-son-directeur",
    title: "Préparer des articles pour un rendez-vous avec son directeur",
    excerpt:
      "Avant un rendez-vous avec son directeur, organisez les articles par questions, preuves, points flous et prochaines actions.",
    seo_keywords: ["rendez-vous directeur thèse articles", "préparer réunion doctorat", "notes de recherche réunion", ...commonKeywords],
    intro:
      "Avant un rendez-vous avec votre directeur, vous n'avez pas besoin de produire un résumé parfait de chaque article. Vous devez surtout clarifier ce que vous avez compris, ce qui reste flou et la décision à prendre ensuite.",
    sections: [
      {
        heading: "Pourquoi préparer les articles",
        paragraphs: [
          "Le temps de réunion est limité. Si vous passez tout le rendez-vous à expliquer les articles depuis le début, il reste peu de place pour discuter de la direction de recherche.",
          "De bonnes notes de réunion mettent en avant les preuves, les points flous et les prochaines étapes.",
        ],
      },
      {
        heading: "Garder la question principale de chaque article",
        paragraphs: [
          "Pour chaque article, distinguez la question de recherche de l'article et la question que vous voulez poser à votre directeur.",
          "Les discussions de suivi commencent souvent par des questions, pas par des résumés.",
        ],
      },
      {
        heading: "Séparer ce qui est clair de ce qui ne l'est pas",
        paragraphs: [
          "Ne cachez pas les zones floues. Indiquez si la méthode, l'interprétation ou le lien avec votre projet pose problème.",
          "Une incertitude précise mène à un meilleur retour.",
        ],
      },
      {
        heading: "Préparer les prochains articles à lire",
        paragraphs: [
          "Apportez une courte liste d'articles à lire ensuite: citations importantes, résultats opposés ou méthodes à comprendre.",
          "Cela transforme le rendez-vous en élément d'une routine de recherche.",
        ],
      },
      {
        heading: "Utiliser Brify comme carte de réunion",
        paragraphs: [
          "Brify peut organiser questions, preuves, doutes et prochaines actions dans une même carte.",
          "Il devient plus facile de guider la discussion et de conserver les décisions après la réunion.",
        ],
      },
    ],
    closing:
      "Les notes de rendez-vous doivent clarifier la discussion, pas seulement prouver que vous avez lu. Utilisez Brify pour organiser questions et preuves avant la réunion.",
  },
  {
    koSlug: "group-papers-by-theme-for-literature-review",
    slug: "regrouper-les-articles-par-theme-pour-une-revue-de-litterature",
    title: "Regrouper les articles par thème pour une revue de littérature",
    excerpt:
      "Regroupez les articles par thème, débat, méthode, population et résultats opposés au lieu de les lister par auteur.",
    seo_keywords: ["regrouper articles par thème", "revue de littérature thématique", "organisation revue de littérature", ...commonKeywords],
    intro:
      "Lister les articles par auteur permet de démarrer facilement, mais cela affaiblit souvent l'argument. Une revue solide montre une structure thématique, pas seulement une liste d'articles.",
    sections: [
      {
        heading: "La limite d'une organisation auteur par auteur",
        paragraphs: [
          "L'organisation par auteur montre qui a fait quoi, mais pas comment le champ est structuré.",
          "Une revue de littérature a besoin de logique plus que de chronologie.",
        ],
      },
      {
        heading: "Créer des groupes thématiques",
        paragraphs: [
          "Cherchez les thèmes qui reviennent: questions proches, phénomènes similaires ou cadres théoriques partagés.",
          "Ces groupes peuvent devenir les grandes sections de la revue.",
        ],
      },
      {
        heading: "Regrouper par méthode quand c'est utile",
        paragraphs: [
          "Dans certains sujets, les méthodes expliquent les différences de résultats. Expériences, enquêtes, entretiens, études de cas et données de plateforme produisent des preuves différentes.",
          "Les groupes méthodologiques aident à expliquer les désaccords plus finement.",
        ],
      },
      {
        heading: "Regrouper les résultats contradictoires",
        paragraphs: [
          "Certaines des meilleures sections de revue viennent des désaccords.",
          "Séparez les résultats contradictoires et demandez si population, contexte, mesure ou méthode expliquent la différence.",
        ],
      },
      {
        heading: "Construire la structure thématique dans Brify",
        paragraphs: [
          "Brify permet d'organiser les articles sous thèmes, méthodes, résultats et limites.",
          "Transformer une liste d'auteurs en structure thématique rend la revue plus facile à écrire et à corriger.",
        ],
      },
    ],
    closing:
      "Une bonne revue de littérature est une conversation de recherche structurée par thèmes. Utilisez Brify pour transformer votre liste d'articles en structure lisible.",
  },
  {
    koSlug: "when-zotero-notion-is-not-enough-for-literature-review",
    slug: "quand-zotero-et-notion-ne-suffisent-pas-pour-une-revue-de-litterature",
    title: "Quand Zotero et Notion ne suffisent pas pour une revue de littérature",
    excerpt:
      "Zotero et Notion sont utiles, mais une revue de littérature demande aussi une structure, des relations et une carte des lacunes.",
    seo_keywords: ["outil revue de littérature", "Zotero Notion revue de littérature", "outils doctorant recherche", ...commonKeywords],
    intro:
      "Zotero et Notion sont des outils utiles. Mais gérer des références et construire la logique d'une revue de littérature sont deux tâches différentes.",
    sections: [
      {
        heading: "Ce que Zotero et Notion font bien",
        paragraphs: [
          "Zotero est puissant pour gérer les références, les citations et les PDF. Notion est flexible pour les notes et les bases de données.",
          "Ces deux outils peuvent être des éléments importants d'un système de recherche.",
        ],
      },
      {
        heading: "Gérer les références n'est pas structurer la revue",
        paragraphs: [
          "Bien enregistrer les références ne crée pas automatiquement l'argument d'une revue.",
          "Une revue a aussi besoin de relations entre articles, de débats, de lacunes et d'un fil vers votre question.",
        ],
      },
      {
        heading: "Le problème des relations entre articles",
        paragraphs: [
          "Quand les articles s'accumulent, les notes restent accessibles mais les relations deviennent plus difficiles à voir.",
          "Les lacunes et les résultats contradictoires sont particulièrement difficiles à repérer si chaque note reste isolée.",
        ],
      },
      {
        heading: "Pourquoi créer un fil de revue séparé",
        paragraphs: [
          "Une revue de littérature transforme des sources stockées en argument. Cette étape demande des groupes thématiques et un ordre logique.",
          "Séparer stockage des sources et cartographie de la structure rend le flux de travail plus clair.",
        ],
      },
      {
        heading: "La place de Brify dans le flux de travail",
        paragraphs: [
          "Vous pouvez garder références et PDF dans Zotero, puis utiliser Brify pour cartographier relations, thèmes, débats et lacunes.",
          "Chaque outil peut ainsi faire ce qu'il fait le mieux.",
        ],
      },
    ],
    closing:
      "La gestion des références et la structure d'une revue de littérature sont deux problèmes différents. Gardez vos sources où elles sont, et utilisez Brify pour cartographier leurs relations.",
  },
  {
    koSlug: "how-to-select-papers-for-literature-review",
    slug: "comment-selectionner-les-articles-pour-une-revue-de-litterature",
    title: "Comment sélectionner les articles pour une revue de littérature",
    excerpt:
      "Sélectionnez les articles selon leur pertinence, leur méthode, leur contexte de citation, leur actualité et leur lien avec la lacune de recherche.",
    seo_keywords: ["sélectionner articles revue de littérature", "critères revue de littérature", "sélection travaux antérieurs", ...commonKeywords],
    intro:
      "Dans une revue de littérature, collecter beaucoup d'articles compte moins que sélectionner ceux dont votre question de recherche a vraiment besoin.",
    sections: [
      {
        heading: "Pourquoi la sélection compte plus que le volume",
        paragraphs: [
          "Si chaque résultat de recherche entre dans la revue, l'argument devient dispersé.",
          "Une revue solide explique clairement pourquoi certains articles sont inclus et pourquoi d'autres sont exclus.",
        ],
      },
      {
        heading: "Définir critères d'inclusion et d'exclusion",
        paragraphs: [
          "Définissez des critères comme sujet, population, méthode, période, domaine et type de données.",
          "Excluez les articles trop éloignés, seulement vaguement liés ou impossibles à comparer avec vos études principales.",
        ],
      },
      {
        heading: "Équilibrer travaux récents et textes fondateurs",
        paragraphs: [
          "Les articles récents montrent les débats actuels, mais les textes fondateurs expliquent l'origine du champ.",
          "Une bonne revue a souvent besoin des deux.",
        ],
      },
      {
        heading: "Vérifier le lien avec votre question",
        paragraphs: [
          "Pour chaque article, écrivez une phrase expliquant son lien avec votre projet.",
          "Si cette phrase est difficile à écrire, l'article n'a peut-être pas sa place dans le coeur de la revue.",
        ],
      },
      {
        heading: "Noter les raisons de sélection dans Brify",
        paragraphs: [
          "Brify peut vous aider à conserver les raisons d'inclusion et d'exclusion à côté des articles.",
          "C'est utile lorsque vous devez plus tard expliquer le périmètre de votre revue.",
        ],
      },
    ],
    closing:
      "Une revue de littérature ne doit pas inclure tous les articles trouvés. Utilisez Brify pour garder la raison de présence de chaque article.",
  },
  {
    koSlug: "literature-review-outline-before-writing",
    slug: "faire-un-plan-de-revue-de-litterature-avant-de-rediger",
    title: "Faire un plan de revue de littérature avant de rédiger",
    excerpt:
      "Avant de rédiger une revue de littérature, structurez thèmes, groupes d'articles, débats, lacunes et question de recherche.",
    seo_keywords: ["plan revue de littérature", "structure revue de littérature", "rédiger travaux antérieurs", ...commonKeywords],
    intro:
      "Rédiger une revue de littérature à partir d'une page vide est difficile. Avant le brouillon, il faut structurer les thèmes, groupes d'articles, débats, lacunes et votre propre question.",
    sections: [
      {
        heading: "Pourquoi commencer à écrire bloque",
        paragraphs: [
          "Même après avoir lu beaucoup d'articles, la rédaction se bloque si l'ordre n'est pas clair.",
          "Une revue de littérature ne s'écrit pas dans l'ordre de lecture. Elle s'écrit dans l'ordre de l'argument.",
        ],
      },
      {
        heading: "Groupes d'articles et plan ne sont pas identiques",
        paragraphs: [
          "Un groupe d'articles rassemble des études similaires. Un plan décide dans quel ordre le lecteur doit rencontrer l'argument.",
          "Distinguer ces deux niveaux évite que la revue devienne un simple tableau de classification.",
        ],
      },
      {
        heading: "Construire un fil centré sur les débats",
        paragraphs: [
          "Une revue devient plus forte lorsqu'elle suit des débats et questions non résolues, pas seulement des thèmes.",
          "Les débats conduisent naturellement vers votre propre question de recherche.",
        ],
      },
      {
        heading: "Relier la lacune à la fin",
        paragraphs: [
          "La fin de la revue doit pointer vers une lacune et votre question.",
          "Sans ce lien, la revue soutient mal un projet de recherche ou une introduction de mémoire.",
        ],
      },
      {
        heading: "Transformer une carte Brify en brouillon",
        paragraphs: [
          "Une carte Brify peut devenir le plan de votre revue de littérature.",
          "Utilisez les grands thèmes, sous-débats, articles clés et lacunes comme noeuds, puis développez chaque noeud en paragraphe.",
        ],
      },
    ],
    closing:
      "Une revue de littérature devrait commencer par une structure, pas par la panique de la page blanche. Utilisez Brify pour construire le plan d'abord.",
  },
  {
    koSlug: "how-to-explain-differences-between-papers",
    slug: "expliquer-les-differences-entre-articles-dans-une-revue-de-litterature",
    title: "Expliquer les différences entre articles dans une revue de littérature",
    excerpt:
      "Expliquez les différences entre articles en comparant méthodes, populations, résultats, interprétations et lien avec votre question.",
    seo_keywords: ["comparer articles revue de littérature", "différences entre articles scientifiques", "comparaison revue de littérature", ...commonKeywords],
    intro:
      "Expliquer les différences entre articles ne consiste pas à aligner des résultats côte à côte. Une revue de littérature doit expliquer pourquoi ces différences existent et ce qu'elles signifient pour votre recherche.",
    sections: [
      {
        heading: "Pourquoi les différences comptent",
        paragraphs: [
          "Des articles sur le même sujet peuvent arriver à des conclusions différentes. Si vous n'expliquez pas pourquoi, la revue devient confuse.",
          "Les différences révèlent les débats, limites et questions non résolues du champ.",
        ],
      },
      {
        heading: "Commencer par les différences de méthode",
        paragraphs: [
          "Quand les résultats diffèrent, regardez d'abord les méthodes. Enquêtes, entretiens, expériences et études de cas soutiennent des affirmations différentes.",
          "Comprendre les méthodes aide à interpréter les résultats plus justement.",
        ],
      },
      {
        heading: "Comparer population et contexte",
        paragraphs: [
          "Le même phénomène peut changer selon étudiants, professionnels, experts, débutants, pays ou institutions.",
          "Le contexte explique souvent pourquoi les conclusions ne coïncident pas parfaitement.",
        ],
      },
      {
        heading: "Traiter les résultats contradictoires avec prudence",
        paragraphs: [
          "Ne forcez pas les résultats opposés dans une conclusion trop simple.",
          "Expliquez plutôt les conditions dans lesquelles chaque résultat apparaît.",
        ],
      },
      {
        heading: "Cartographier les causes dans Brify",
        paragraphs: [
          "Brify permet de mettre côte à côte méthode, population, contexte et résultats.",
          "Quand les causes possibles deviennent visibles, votre revue devient analytique plutôt que descriptive.",
        ],
      },
    ],
    closing:
      "Les différences entre articles doivent être interprétées, pas seulement listées. Utilisez Brify pour cartographier les raisons possibles de ces différences.",
  },
  {
    koSlug: "weekly-literature-review-routine-for-grad-students",
    slug: "routine-hebdomadaire-de-revue-de-litterature-pour-doctorants",
    title: "Une routine hebdomadaire de revue de littérature pour doctorants",
    excerpt:
      "Une routine hebdomadaire aide les doctorants à chercher, sélectionner, structurer les articles et mettre à jour leur question de recherche.",
    seo_keywords: ["routine revue de littérature", "routine recherche doctorant", "workflow revue de littérature doctorat", ...commonKeywords],
    intro:
      "Une revue de littérature ne devrait pas être écrite dans l'urgence avant une échéance. Pour un doctorant, elle fonctionne mieux comme un système de recherche hebdomadaire qui s'accumule avec le temps.",
    sections: [
      {
        heading: "Pourquoi une routine hebdomadaire aide",
        paragraphs: [
          "Si la lecture dépend seulement des échéances, les sources s'accumulent sans structure.",
          "Une routine hebdomadaire transforme recherche, sélection, organisation et ajustement de la question en processus répétable.",
        ],
      },
      {
        heading: "Choisir l'axe de recherche de la semaine",
        paragraphs: [
          "Chaque semaine, choisissez un axe: concept, population, méthode, point de vue opposé ou débat récent.",
          "Garder la trace des mots-clés aide aussi à expliquer plus tard le périmètre de la revue.",
        ],
      },
      {
        heading: "Utiliser les mêmes critères pour chaque article",
        paragraphs: [
          "Pour chaque article, notez question, méthode, résultat, limite et lien avec votre projet.",
          "Des critères constants rendent les articles comparables un mois plus tard.",
        ],
      },
      {
        heading: "Mettre à jour la question de recherche",
        paragraphs: [
          "La dernière étape de la semaine consiste à mettre à jour votre propre question.",
          "Demandez si les nouveaux articles l'ont précisée, modifiée, renforcée ou contestée.",
        ],
      },
      {
        heading: "Maintenir la routine dans Brify",
        paragraphs: [
          "Brify peut réunir groupes d'articles hebdomadaires, lacunes, mots-clés et prochaines actions dans une carte.",
          "Avec le temps, cette carte devient le squelette de la revue de littérature.",
        ],
      },
    ],
    closing:
      "Une revue de littérature est un système de recherche qui grandit chaque semaine. Utilisez Brify pour accumuler des structures d'articles avant l'échéance de rédaction.",
  },
  {
    koSlug: "what-to-check-when-using-ai-for-literature-review",
    slug: "que-verifier-quand-on-utilise-ia-pour-une-revue-de-litterature",
    title: "Que vérifier quand on utilise l'IA pour une revue de littérature",
    excerpt:
      "Quand vous utilisez l'IA pour une revue de littérature, vérifiez le périmètre de recherche, la sélection des articles, les sources et l'interprétation des lacunes.",
    seo_keywords: ["IA revue de littérature", "outil IA revue de littérature", "automatiser revue de littérature", ...commonKeywords],
    intro:
      "L'IA peut accélérer une revue de littérature. Mais une revue exige toujours un jugement de recherche: les résultats de l'IA doivent donc être vérifiés de façon structurée.",
    sections: [
      {
        heading: "Ce que l'IA peut aider à faire",
        paragraphs: [
          "L'IA peut aider à parcourir de longs articles, extraire des thèmes, résumer des résultats et proposer une première structure.",
          "Elle est particulièrement utile au début de l'exploration ou pour préparer un premier plan.",
        ],
      },
      {
        heading: "Ne pas croire aveuglément la sélection des articles",
        paragraphs: [
          "L'IA peut oublier des textes importants, inclure des études peu liées ou refléter un périmètre de recherche trop étroit.",
          "Vous devez pouvoir expliquer vous-même les critères de sélection.",
        ],
      },
      {
        heading: "Vérifier sources et contexte de citation",
        paragraphs: [
          "Comparez toujours les résumés de l'IA avec la source originale. Le contexte de citation, les formulations prudentes et les limites peuvent être aplatis.",
          "Un résumé fluide n'est pas une revue vérifiée.",
        ],
      },
      {
        heading: "Relire soi-même les lacunes de recherche",
        paragraphs: [
          "L'IA peut proposer des lacunes trop vite. Une vraie lacune doit être fondée sur des différences, limites et questions manquantes dans plusieurs études.",
          "Traitez les lacunes générées par IA comme des candidates, pas comme des conclusions.",
        ],
      },
      {
        heading: "Utiliser Brify pour vérifier le résultat IA",
        paragraphs: [
          "Brify peut transformer les notes de revue générées par IA en carte de structure pour vérifier lacunes, sources et exagérations.",
          "Vous combinez ainsi la vitesse de l'IA avec le jugement humain de recherche.",
        ],
      },
    ],
    closing:
      "L'IA peut accélérer la revue de littérature, mais la structure doit rester vérifiable. Utilisez Brify pour inspecter et corriger le résultat avant de lui faire confiance.",
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
