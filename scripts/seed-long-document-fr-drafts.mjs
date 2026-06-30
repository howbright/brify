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
  "résumé de long document",
  "résumé PDF",
  "structuration de document",
  "résumé de document IA",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Une méthode concrète",
    `Pour appliquer ${post.title.toLowerCase()} dans un vrai contexte de travail, ne commencez pas par lire chaque page dans l'ordre. Commencez par décider à quoi le document servira: préparer une réunion, rédiger un rapport, comparer des sources, vérifier une décision ou retrouver rapidement une information plus tard.`,
    "Ensuite, formulez en une phrase la question principale du document. Parcourez le titre, le sommaire, les intertitres, les tableaux, les figures et la conclusion. À ce stade, le but n'est pas encore de tout comprendre. Le but est de construire une carte du document.",
    "Pour chaque grande partie, séparez l'idée principale, les preuves, les chiffres, les conditions, les exceptions et les actions possibles. Cette séparation transforme le document en matériau réutilisable au lieu de produire seulement un résumé court.",
    "## Comment le structurer dans Brify",
    `Dans Brify, vous pouvez organiser ${post.seo_keywords[0]} avec des noeuds comme objectif du document, conclusion principale, preuves importantes, tableaux et chiffres, conditions à vérifier, questions ouvertes et prochaines actions.`,
    "Plus le document est long, plus il est risqué de garder seulement quelques phrases impressionnantes. Il faut conserver le lien entre une affirmation, la partie du document où elle apparaît, les preuves qui la soutiennent et les limites qui l'encadrent.",
    "Une carte de structure aide aussi à distinguer ce qui est déjà clair de ce qui doit encore être vérifié. Les résumés générés par IA sont utiles pour avancer vite, mais les longs documents contiennent souvent des tableaux, des notes, des annexes ou des exceptions qui méritent une seconde lecture.",
    "## Les erreurs fréquentes",
    "La première erreur consiste à réduire un long document à un seul paragraphe. C'est pratique pour se faire une idée rapide, mais cela devient fragile dès qu'il faut retrouver la preuve exacte ou citer un passage avec prudence.",
    "La deuxième erreur consiste à croire trop vite le titre et la conclusion. Dans un rapport, un manuel ou un PDF technique, les conditions, les limites et les exceptions peuvent changer complètement la manière d'utiliser la conclusion.",
    "La troisième erreur consiste à ignorer la mise en page d'un PDF. Les tableaux, les encadrés, les notes, les figures et les annexes ne sont pas des détails décoratifs. Ils portent parfois l'information la plus importante.",
    "## Que faire aujourd'hui",
    `Si vous voulez commencer ${post.seo_keywords[0]} aujourd'hui, choisissez un seul document long et marquez uniquement le titre, le sommaire, la conclusion, les tableaux et les conditions importantes.`,
    "Puis écrivez une phrase pour chaque grande partie: pourquoi pourrais-je avoir besoin de cette partie plus tard ? Si la réponse est claire, gardez cette partie dans la carte. Si elle est faible, traitez-la comme un contexte secondaire.",
    "Commencer petit suffit. L'important est de laisser derrière vous une structure qui aide à retrouver, comparer, expliquer ou réutiliser le document.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "how-to-summarize-long-documents",
    slug: "comment-resumer-un-long-document",
    title: "Comment résumer un long document",
    excerpt:
      "Apprenez à résumer un long document en séparant objectif, structure, idées principales, preuves, conditions et éléments réutilisables.",
    seo_keywords: ["comment résumer un long document", "résumé long document", "méthode résumé document", ...commonKeywords],
    intro:
      "Résumer un long document ne veut pas dire compresser chaque phrase. Le vrai objectif est de comprendre ce que le document essaie de démontrer, avec quelles preuves, dans quelles limites et pour quel usage.",
    sections: [
      {
        heading: "Pourquoi les longs documents sont difficiles à résumer",
        paragraphs: [
          "Un long document est difficile parce que les priorités ne sont pas immédiatement visibles. Le contexte, les preuves, les exceptions et les conclusions se mélangent souvent.",
          "Si vous résumez sans structure, le résultat peut être court, mais difficile à réutiliser plus tard.",
        ],
      },
      {
        heading: "Définir l'objectif avant de résumer",
        paragraphs: [
          "Le même document ne se résume pas de la même façon pour étudier, préparer une réunion, rédiger une note ou prendre une décision.",
          "Quand l'objectif est clair, il devient plus facile de décider ce qu'il faut garder, compresser ou vérifier.",
        ],
      },
      {
        heading: "Utiliser les titres comme carte",
        paragraphs: [
          "Le sommaire et les intertitres jouent le rôle de carte. Ils permettent de diviser le document avant d'entrer dans les détails.",
          "Repérer le rôle de chaque partie donne un résumé plus solide que l'extraction de quelques phrases importantes.",
        ],
      },
      {
        heading: "Séparer affirmations et preuves",
        paragraphs: [
          "Un résumé qui garde seulement les conclusions peut devenir trompeur. Il faut aussi garder les preuves, les chiffres, les conditions et les limites.",
          "Les comparaisons, les critères et les exceptions sont souvent les éléments qu'il faudra retrouver plus tard.",
        ],
      },
      {
        heading: "Utiliser Brify pour structurer le document",
        paragraphs: [
          "Brify aide à transformer un long document en carte de structure plutôt qu'en simple paragraphe de résumé.",
          "En séparant objectif, conclusion, preuves et conditions, le document devient plus facile à consulter de nouveau.",
        ],
      },
    ],
    closing:
      "Résumer un long document, ce n'est pas seulement le raccourcir. C'est le rendre réutilisable. Brify vous aide à construire la structure avant de vous appuyer sur le résumé.",
  },
  {
    koSlug: "common-pdf-summary-mistakes",
    slug: "erreurs-frequentes-resume-pdf",
    title: "Les erreurs fréquentes quand on résume un PDF",
    excerpt:
      "Les résumés de PDF oublient souvent tableaux, figures, notes, annexes et indices de mise en page. Voici ce qu'il faut vérifier.",
    seo_keywords: ["erreurs résumé PDF", "résumé PDF IA", "outil résumé PDF", ...commonKeywords],
    intro:
      "Un PDF n'est pas seulement un bloc de texte. Les tableaux, figures, notes de bas de page, encadrés, annexes et choix de mise en page peuvent porter une partie essentielle du sens.",
    sections: [
      {
        heading: "Un PDF contient plus que du texte",
        paragraphs: [
          "Les informations importantes d'un PDF peuvent se trouver en dehors des paragraphes principaux.",
          "Un tableau peut contenir les résultats, une note peut préciser une condition et une annexe peut donner le détail qui rend la conclusion exacte.",
        ],
      },
      {
        heading: "Les tableaux et figures disparaissent facilement",
        paragraphs: [
          "Un résumé automatique peut privilégier les phrases et mal refléter les tableaux ou les graphiques.",
          "Après un résumé de PDF, vérifiez toujours si les tableaux et figures essentiels sont bien représentés.",
        ],
      },
      {
        heading: "Les notes et annexes changent parfois le sens",
        paragraphs: [
          "Les notes et annexes semblent secondaires, mais elles contiennent souvent des règles d'interprétation.",
          "Dans un document juridique, politique, technique ou financier, oublier une annexe peut changer la conclusion pratique.",
        ],
      },
      {
        heading: "La mise en page donne une hiérarchie",
        paragraphs: [
          "Un PDF utilise l'ordre des pages, les encadrés, les titres et l'emphase visuelle pour signaler l'importance.",
          "Quand on extrait seulement le texte, cette hiérarchie peut disparaître.",
        ],
      },
      {
        heading: "Vérifier un résumé PDF dans Brify",
        paragraphs: [
          "Brify permet de séparer texte principal, tableaux, figures, conditions et annexes dans une carte.",
          "Cela aide à vérifier si le résumé suit encore la structure du PDF original.",
        ],
      },
    ],
    closing:
      "Un résumé de PDF peut faire gagner du temps, mais il devient risqué s'il efface les tableaux et les conditions. Brify aide à relire la structure du PDF en même temps que le résumé.",
  },
  {
    koSlug: "why-document-structuring-matters",
    slug: "pourquoi-structurer-un-document",
    title: "Pourquoi structurer un document compte plus qu'un simple résumé",
    excerpt:
      "La structuration rend un document plus facile à retrouver, vérifier, comparer et réutiliser qu'un résumé très court.",
    seo_keywords: ["structuration de document", "organiser un document", "résumé de document", ...commonKeywords],
    intro:
      "Un résumé aide à comprendre rapidement. Mais quand il faut réutiliser un document, retrouver une preuve ou comparer plusieurs sources, la structure devient souvent plus importante que la compression.",
    sections: [
      {
        heading: "Résumé et structure ne font pas le même travail",
        paragraphs: [
          "Un résumé raccourcit le contenu. Une structure organise le contenu pour qu'il soit retrouvable et réutilisable.",
          "Dans les longs documents, ces deux objectifs ne doivent pas être confondus.",
        ],
      },
      {
        heading: "Quand un résumé court ne suffit pas",
        paragraphs: [
          "En réunion ou dans un rapport, il faut parfois retrouver la preuve derrière une affirmation.",
          "Un paragraphe de résumé montre rarement de quelle partie vient une conclusion et quelles conditions l'encadrent.",
        ],
      },
      {
        heading: "La structure rend le document cherchable",
        paragraphs: [
          "Organiser le document par objectif, preuves, conditions et actions facilite la recherche ultérieure.",
          "Cela compte autant pour les documents de travail que pour les notes d'étude.",
        ],
      },
      {
        heading: "La structure facilite la comparaison",
        paragraphs: [
          "Quand plusieurs documents suivent la même structure, il devient plus simple de comparer leurs conclusions et leurs limites.",
          "Vous pouvez placer les preuves, chiffres et conditions au même endroit pour chaque document.",
        ],
      },
      {
        heading: "Pourquoi Brify convient à ce travail",
        paragraphs: [
          "Brify ne limite pas le document à un résumé plat. Il permet de créer une carte de structure.",
          "Plus le document est long, plus cette structure économise du temps lors des relectures.",
        ],
      },
    ],
    closing:
      "Structurer un document, c'est préparer son usage futur. Brify aide à transformer un long document en carte claire, vérifiable et réutilisable.",
  },
  {
    koSlug: "how-to-read-long-reports-faster",
    slug: "lire-un-long-rapport-plus-vite",
    title: "Comment lire un long rapport plus vite",
    excerpt:
      "Lisez un long rapport plus vite en séparant conclusion, indicateurs clés, preuves, risques, conditions et prochaines actions.",
    seo_keywords: ["résumé de rapport", "lire un long rapport", "organiser un rapport", ...commonKeywords],
    intro:
      "Lire un long rapport plus vite ne consiste pas à sauter des pages au hasard. Il s'agit de trouver plus rapidement les informations nécessaires à une décision, une réunion ou une présentation.",
    sections: [
      {
        heading: "Un rapport sert souvent une décision",
        paragraphs: [
          "Beaucoup de rapports ne se contentent pas d'informer. Ils préparent une décision ou défendent une recommandation.",
          "Il faut donc séparer conclusion, données, risques, limites et actions proposées.",
        ],
      },
      {
        heading: "Commencer par le résumé et la conclusion",
        paragraphs: [
          "Le résumé exécutif et la conclusion donnent la direction générale du rapport.",
          "Ensuite, il faut vérifier quelles données, hypothèses et conditions soutiennent cette direction.",
        ],
      },
      {
        heading: "Marquer les chiffres importants",
        paragraphs: [
          "Les chiffres donnent souvent du poids à une conclusion.",
          "Notez les unités, périodes, échantillons, ratios et critères de comparaison pour éviter les citations imprécises.",
        ],
      },
      {
        heading: "Repérer risques et exceptions",
        paragraphs: [
          "Un bon rapport mentionne aussi les limites, risques et incertitudes.",
          "Oublier ces passages peut rendre la conclusion plus forte qu'elle ne l'est réellement.",
        ],
      },
      {
        heading: "Cartographier le rapport dans Brify",
        paragraphs: [
          "Brify permet de placer conclusion, indicateurs, preuves, risques et prochaines actions dans une même carte.",
          "Avant une réunion, cette structure rend le rapport beaucoup plus facile à revoir.",
        ],
      },
    ],
    closing:
      "Lire un long rapport rapidement, c'est trouver les bonnes informations sans perdre le raisonnement. Brify aide à structurer conclusion et preuves.",
  },
  {
    koSlug: "pdf-summary-tool-checklist",
    slug: "choisir-un-outil-de-resume-pdf",
    title: "Comment choisir un outil de résumé PDF",
    excerpt:
      "Pour choisir un outil de résumé PDF, vérifiez la gestion des tableaux, le retour à la source, la structure, l'édition et le partage.",
    seo_keywords: ["outil résumé PDF", "résumeur PDF IA", "choisir outil PDF", ...commonKeywords],
    intro:
      "Il existe beaucoup d'outils de résumé PDF, mais ils ne répondent pas tous au même besoin. Un bon outil ne doit pas seulement produire un paragraphe court. Il doit aider à vérifier, modifier et réutiliser le contenu.",
    sections: [
      {
        heading: "La qualité de phrase ne suffit pas",
        paragraphs: [
          "Un résumé fluide n'est pas automatiquement un résumé fiable.",
          "Il faut savoir si la structure, les preuves et les conditions du PDF restent visibles.",
        ],
      },
      {
        heading: "Vérifier tableaux et figures",
        paragraphs: [
          "Dans de nombreux PDF, les informations clés sont dans les tableaux, graphiques ou schémas.",
          "Un bon outil doit permettre de contrôler si ces éléments sont bien pris en compte.",
        ],
      },
      {
        heading: "Pouvoir revenir à la source",
        paragraphs: [
          "Si un résumé semble convaincant mais ne permet pas de retrouver l'origine d'une affirmation, il reste fragile.",
          "Un retour par page, section ou élément source est très utile.",
        ],
      },
      {
        heading: "Édition et réutilisation comptent",
        paragraphs: [
          "Un résumé est souvent un premier brouillon.",
          "Dans un vrai travail, il faut le réorganiser, le corriger, le partager ou le transformer en note.",
        ],
      },
      {
        heading: "La place de Brify",
        paragraphs: [
          "Brify se concentre sur la transformation du PDF en carte de structure.",
          "C'est particulièrement utile quand vous avez besoin d'un résumé vérifiable et réutilisable.",
        ],
      },
    ],
    closing:
      "Pour choisir un outil de résumé PDF, regardez la structure vérifiable plutôt que la seule brièveté du résultat. Brify aide à relire les PDF sous forme de carte.",
  },
  {
    koSlug: "organize-meeting-documents",
    slug: "organiser-documents-de-reunion",
    title: "Comment organiser des documents de réunion et des propositions",
    excerpt:
      "Organisez les documents de réunion par objectif, ordre du jour, preuves, points de discussion, décisions et prochaines actions.",
    seo_keywords: ["organiser documents réunion", "résumé document réunion", "structurer proposition", ...commonKeywords],
    intro:
      "Les documents de réunion et les propositions ne sont pas seulement faits pour être lus. Ils servent à discuter, décider et agir. C'est pourquoi une structure claire vaut mieux qu'un simple résumé.",
    sections: [
      {
        heading: "Un document de réunion mène à une décision",
        paragraphs: [
          "Avant de lire, demandez quelle décision le document doit soutenir.",
          "Sans cet objectif, les informations importantes et le contexte secondaire se mélangent.",
        ],
      },
      {
        heading: "Séparer ordre du jour et contexte",
        paragraphs: [
          "L'ordre du jour correspond aux questions à discuter. Le contexte explique pourquoi elles comptent.",
          "Les séparer aide à garder une réunion plus concentrée.",
        ],
      },
      {
        heading: "Marquer preuves et points de débat",
        paragraphs: [
          "Une proposition mélange souvent affirmations, preuves et hypothèses.",
          "Relier chaque preuve à l'affirmation qu'elle soutient facilite les questions et objections.",
        ],
      },
      {
        heading: "Garder décisions et actions",
        paragraphs: [
          "Après la réunion, le plus important est souvent de savoir ce qui a été décidé et qui doit faire quoi.",
          "Un résumé sans prochaines actions risque de rester inutilisable.",
        ],
      },
      {
        heading: "Préparer la réunion dans Brify",
        paragraphs: [
          "Brify peut organiser ordre du jour, preuves, points ouverts et décisions possibles dans une carte.",
          "Même une longue proposition devient plus facile à discuter.",
        ],
      },
    ],
    closing:
      "Un document de réunion doit conduire à une décision claire. Brify aide à organiser les arguments, les preuves et les prochaines actions.",
  },
  {
    koSlug: "summarize-manuals-and-guides",
    slug: "resumer-manuels-guides",
    title: "Comment résumer des manuels et des guides",
    excerpt:
      "Résumez manuels et guides en organisant procédures, conditions, exceptions, listes de contrôle et étapes de dépannage.",
    seo_keywords: ["résumé manuel", "organiser guide", "résumé guide de travail", ...commonKeywords],
    intro:
      "Un manuel ou un guide n'est pas toujours un document que l'on lit une fois du début à la fin. C'est souvent un document auquel on revient quand il faut suivre la bonne procédure au bon moment.",
    sections: [
      {
        heading: "Un manuel est un document de procédure",
        paragraphs: [
          "Dans un manuel, l'ordre des actions compte autant que les actions elles-mêmes.",
          "Si la séquence est floue, les erreurs apparaissent au moment de l'exécution.",
        ],
      },
      {
        heading: "Séparer conditions et exceptions",
        paragraphs: [
          "Les guides contiennent souvent des règles générales et des exceptions.",
          "Si les exceptions disparaissent dans le résumé, le guide peut être mal appliqué.",
        ],
      },
      {
        heading: "Transformer le contenu en checklist",
        paragraphs: [
          "Une checklist rend le manuel plus facile à utiliser dans le travail réel.",
          "Ajoutez si possible un critère de réussite ou de vérification pour chaque étape.",
        ],
      },
      {
        heading: "Isoler le dépannage",
        paragraphs: [
          "Les sections de dépannage sont souvent les plus consultées plus tard.",
          "Organisez problème, cause possible et action recommandée séparément.",
        ],
      },
      {
        heading: "Réutiliser le manuel avec Brify",
        paragraphs: [
          "Brify permet de transformer procédures, conditions, exceptions et checklists en carte de structure.",
          "Un manuel bien structuré devient utile pour la formation, la transmission et le travail répété.",
        ],
      },
    ],
    closing:
      "Résumer un manuel, ce n'est pas seulement le raccourcir. C'est le rendre plus facile à exécuter correctement. Brify aide à structurer procédures et exceptions.",
  },
  {
    koSlug: "compare-multiple-pdfs",
    slug: "comparer-plusieurs-pdf",
    title: "Comment comparer plusieurs PDF",
    excerpt:
      "Comparez plusieurs PDF avec une structure commune: objectif, conclusion, preuves, chiffres, conditions, points communs et différences.",
    seo_keywords: ["comparer plusieurs PDF", "résumé plusieurs PDF", "comparaison PDF", ...commonKeywords],
    intro:
      "Résumer plusieurs PDF séparément peut sembler pratique au début. Mais dès qu'il faut comparer les documents, les différences deviennent difficiles à voir si les résumés n'ont pas la même structure.",
    sections: [
      {
        heading: "Pourquoi les résumés séparés deviennent confus",
        paragraphs: [
          "Chaque PDF peut utiliser un format, un vocabulaire et un niveau de détail différents.",
          "Sans structure commune, vous ne savez plus si les documents répondent vraiment à la même question.",
        ],
      },
      {
        heading: "Créer des critères communs",
        paragraphs: [
          "Choisissez des critères applicables à tous les PDF: objectif, public, conclusion, preuves, chiffres, conditions et limites.",
          "Répéter les mêmes champs rend la comparaison beaucoup plus claire.",
        ],
      },
      {
        heading: "Séparer ressemblances et différences",
        paragraphs: [
          "Les ressemblances montrent la tendance générale. Les différences indiquent ce qui peut influencer une décision.",
          "Les garder séparées évite de mélanger consensus et contradiction.",
        ],
      },
      {
        heading: "Vérifier chiffres et conditions",
        paragraphs: [
          "Les différences entre PDF viennent souvent des unités, périodes, échantillons ou critères de comparaison.",
          "Avant de conclure, vérifiez que les chiffres sont comparables.",
        ],
      },
      {
        heading: "Relier plusieurs PDF dans Brify",
        paragraphs: [
          "Brify permet de placer plusieurs PDF dans une même carte avec des critères partagés.",
          "Cette structure aide à préparer une réunion, une analyse ou un rapport comparatif.",
        ],
      },
    ],
    closing:
      "Plusieurs PDF ne doivent pas seulement être résumés un par un. Ils doivent être comparés avec les mêmes critères. Brify aide à cartographier ressemblances et différences.",
  },
  {
    koSlug: "extract-key-questions-from-documents",
    slug: "extraire-questions-cles-document",
    title: "Comment extraire les questions clés d'un long document",
    excerpt:
      "Identifiez les questions clés d'un long document pour comprendre plus vite objectif, conclusion, preuves et points de débat.",
    seo_keywords: ["questions clés document", "extraire points clés document", "organiser enjeux document", ...commonKeywords],
    intro:
      "Pour comprendre un long document, les questions clés sont parfois plus importantes que les phrases clés. Quand vous savez à quelle question le document répond, les détails deviennent plus faciles à hiérarchiser.",
    sections: [
      {
        heading: "Pourquoi les questions clés comptent",
        paragraphs: [
          "La plupart des documents cherchent à résoudre un problème ou à répondre à une question.",
          "Sans cette question, il est difficile de juger pourquoi une conclusion ou une preuve est importante.",
        ],
      },
      {
        heading: "Transformer les titres en questions",
        paragraphs: [
          "Les titres, intertitres et sommaires indiquent souvent les questions implicites du document.",
          "Reformuler chaque titre sous forme de question révèle mieux la logique du texte.",
        ],
      },
      {
        heading: "Repérer les termes répétés",
        paragraphs: [
          "Les mots et expressions qui reviennent souvent signalent généralement le coeur du problème.",
          "Les regrouper aide à voir ce que le document traite réellement.",
        ],
      },
      {
        heading: "Revenir de la conclusion à la question",
        paragraphs: [
          "Après avoir lu la conclusion, demandez: à quelle question cette conclusion répond-elle ?",
          "Cette étape rend le raisonnement du document plus facile à suivre.",
        ],
      },
      {
        heading: "Construire une carte par questions dans Brify",
        paragraphs: [
          "Dans Brify, placez la question clé au centre, puis reliez preuves, limites et conclusion autour d'elle.",
          "Cette structure fonctionne bien pour les rapports, présentations et notes d'étude.",
        ],
      },
    ],
    closing:
      "Le coeur d'un long document est souvent une question, pas une phrase. Brify aide à relier questions, preuves et conclusions.",
  },
  {
    koSlug: "check-ai-document-summary",
    slug: "verifier-resumes-ia-document",
    title: "Pourquoi il faut vérifier les résumés de documents par IA",
    excerpt:
      "Les résumés IA sont rapides, mais il faut vérifier sections oubliées, conclusions trop fortes, conditions manquantes et erreurs de tableaux.",
    seo_keywords: ["résumé document IA", "vérifier résumé IA", "erreurs résumé automatique", ...commonKeywords],
    intro:
      "Les résumés de documents par IA sont rapides et pratiques. Mais il serait risqué de supposer qu'ils capturent parfaitement les conditions, exceptions, tableaux, annexes et nuances d'un long document.",
    sections: [
      {
        heading: "Un résumé IA est un point de départ",
        paragraphs: [
          "Un résumé IA aide à parcourir un document plus rapidement.",
          "Mais s'il sert à une décision, un rapport ou une présentation, il doit encore être vérifié.",
        ],
      },
      {
        heading: "Chercher les sections oubliées",
        paragraphs: [
          "Dans les longs documents, certaines parties peuvent être peu représentées dans le résumé.",
          "Les limites, annexes, conditions, exceptions et notes méritent une attention particulière.",
        ],
      },
      {
        heading: "Surveiller les conclusions trop affirmées",
        paragraphs: [
          "L'IA peut transformer un langage prudent en phrase plus certaine.",
          "Vérifiez les conditions dans lesquelles le document original formule son affirmation.",
        ],
      },
      {
        heading: "Relire tableaux et chiffres",
        paragraphs: [
          "Une mauvaise interprétation d'un tableau ou d'une métrique peut créer une erreur importante.",
          "Contrôlez unités, périodes, groupes de comparaison et critères.",
        ],
      },
      {
        heading: "Vérifier dans Brify",
        paragraphs: [
          "Brify permet de séparer le résumé IA des preuves et sections sources.",
          "Cette structure rend la vérification plus simple avant de faire confiance au résultat.",
        ],
      },
    ],
    closing:
      "Un résumé IA est un bon début, pas une réponse finale. Brify aide à vérifier les affirmations du résumé avec la structure du document source.",
  },
  {
    koSlug: "use-document-summary-for-reporting",
    slug: "utiliser-resume-document-pour-rapport",
    title: "Comment utiliser un résumé de document pour un rapport ou une présentation",
    excerpt:
      "Transformez un résumé de document en rapport ou présentation en réorganisant public, conclusion, preuves, risques et prochaines actions.",
    seo_keywords: ["utiliser résumé document", "rapport à partir d'un résumé", "présentation résumé document", ...commonKeywords],
    intro:
      "Copier directement un résumé dans un rapport ou une présentation donne souvent un résultat maladroit. Informer un public demande un ordre différent de celui du document source.",
    sections: [
      {
        heading: "Résumé et rapport n'ont pas le même but",
        paragraphs: [
          "Un résumé vous aide à comprendre. Un rapport aide quelqu'un d'autre à comprendre, décider ou agir.",
          "Le même contenu doit donc être réorganisé selon le public.",
        ],
      },
      {
        heading: "Partir de la décision du public",
        paragraphs: [
          "Demandez ce que votre public doit décider ou retenir.",
          "Puis replacez conclusion, preuves et risques autour de ce besoin.",
        ],
      },
      {
        heading: "Ne pas tout mettre dans le flux principal",
        paragraphs: [
          "Trop de preuves affaiblissent le message.",
          "Gardez les chiffres, exemples et conditions vraiment utiles, puis mettez le reste en support.",
        ],
      },
      {
        heading: "Rendre les prochaines actions visibles",
        paragraphs: [
          "Un rapport de travail doit souvent mener à une action.",
          "Séparez décisions, points à vérifier, responsables et étapes suivantes.",
        ],
      },
      {
        heading: "Construire le flux dans Brify",
        paragraphs: [
          "Brify aide à réorganiser un résumé en structure de présentation ou de rapport.",
          "Vous pouvez visualiser conclusion, preuves, risques et prochaines actions dans une même carte.",
        ],
      },
    ],
    closing:
      "Un résumé de document est une matière première. Brify aide à le transformer en structure claire pour un rapport ou une présentation.",
  },
  {
    koSlug: "make-long-documents-searchable",
    slug: "rendre-longs-documents-retrouvables",
    title: "Comment rendre de longs documents faciles à retrouver",
    excerpt:
      "Rendez les longs documents retrouvables en organisant questions clés, mots-clés, sections, preuves, balises et emplacements sources.",
    seo_keywords: ["organiser longs documents", "rendre documents retrouvables", "recherche dans documents", ...commonKeywords],
    intro:
      "Les longs documents deviennent surtout frustrants plus tard, quand il faut retrouver un détail précis. Si vous ne savez plus où se trouvait l'information, même un résumé peut vous renvoyer au document entier.",
    sections: [
      {
        heading: "Une bonne organisation doit être retrouvable",
        paragraphs: [
          "Organiser un document ne sert pas seulement à prouver qu'on l'a lu.",
          "La structure doit aider à retrouver preuves, conditions et points clés au moment où ils deviennent nécessaires.",
        ],
      },
      {
        heading: "Associer mots-clés et questions",
        paragraphs: [
          "Des mots-clés sans contexte peuvent être faibles. Des questions sans mots-clés peuvent être difficiles à rechercher.",
          "Garder les deux ensemble améliore la recherche future.",
        ],
      },
      {
        heading: "Noter les emplacements sources",
        paragraphs: [
          "Savoir dans quelle section une idée apparaît permet de vérifier plus vite le document original.",
          "Les numéros de page, noms de section et titres sont particulièrement utiles.",
        ],
      },
      {
        heading: "Relier preuves et conclusions",
        paragraphs: [
          "Une conclusion sans preuve devient difficile à utiliser plus tard.",
          "Reliez chaque affirmation importante à ses chiffres, conditions et sections sources.",
        ],
      },
      {
        heading: "Créer une carte cherchable dans Brify",
        paragraphs: [
          "Brify aide à organiser les longs documents par mots-clés, relations et logique source.",
          "Quand les documents s'accumulent, cette structure peut devenir une base de connaissances réutilisable.",
        ],
      },
    ],
    closing:
      "Organiser un long document, c'est pouvoir retrouver le bon détail plus tard. Brify aide à garder questions, preuves et conditions dans une carte cherchable.",
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
