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
  "carte mentale IA",
  "carte de structure IA",
  "texte en carte mentale",
  "structuration de document",
  "résumé IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Une méthode concrète",
    `Pour appliquer ${post.seo_keywords[0]} dans un vrai contexte d'étude ou de travail, commencez par ne pas chercher seulement un joli schéma. Demandez-vous plutôt ce que vous devrez retrouver plus tard. Une carte mentale aide à partir d'un sujet central, mais dans un usage sérieux, les relations entre idées, preuves, exemples et conditions comptent encore plus.`,
    "Écrivez d'abord la question principale à laquelle le contenu répond. Parcourez ensuite le texte, la transcription, le document, les notes ou le résumé pour repérer les thèmes répétés et les conclusions importantes. Séparez les preuves et les exemples qui soutiennent ces conclusions. Enfin, marquez les passages sources ou les points incertains à vérifier.",
    "Ce processus transforme une carte mentale IA en structure réutilisable, au lieu d'en faire une simple décoration visuelle. Plus la source est longue, plus cette structure devient importante. Articles, PDF, vidéos YouTube, notes de cours, documents de réunion et résumés de recherche deviennent plus faciles à réutiliser quand leur logique reste visible.",
    "## Comment le structurer dans Brify",
    `Dans Brify, vous pouvez organiser ${post.seo_keywords[0]} avec des noeuds comme question clé, grands thèmes, conclusion, preuves, exemples, points à vérifier et prochaines actions.`,
    "Vous obtenez ainsi une vue proche d'une carte mentale, mais plus pratique comme carte de structure. Vous voyez quelle idée est soutenue par quelle preuve, quel exemple compte vraiment et ce qu'il faut encore vérifier dans la source originale.",
    "C'est pour cela que Brify met l'accent sur les cartes de structure IA. Un résumé IA fluide peut être utile, mais il ne suffit pas toujours pour étudier, préparer un rapport, présenter ou prendre une décision. La structure derrière le résumé doit rester visible et modifiable.",
    "## Les erreurs fréquentes",
    "La première erreur consiste à traiter une carte mentale IA comme un résultat visuel terminé. Une mise en page propre peut rester faible si elle oublie la question principale, les preuves ou les conditions derrière une conclusion.",
    "La deuxième erreur consiste à confondre résumé et structuration. Un résumé raccourcit le contenu. La structuration rend ce contenu plus facile à examiner, vérifier et réutiliser.",
    "La troisième erreur consiste à accepter les catégories de l'IA sans les relire. L'IA peut regrouper des sujets trop largement, oublier une preuve importante ou rendre une conclusion prudente plus catégorique qu'elle ne l'est vraiment. Une bonne carte doit laisser une place à la vérification humaine.",
    "## Que faire aujourd'hui",
    `Si vous voulez commencer ${post.seo_keywords[0]} aujourd'hui, choisissez une source longue et notez seulement trois choses: à quelle question répond-elle, quelle est sa conclusion la plus importante, et où se trouve la preuve qui soutient cette conclusion ?`,
    "Placez ensuite la question clé au centre d'une carte Brify, puis reliez autour d'elle les thèmes, conclusions, preuves, exemples et points à vérifier. La première carte n'a pas besoin d'être parfaite. L'important est de laisser une structure qui vous permettra de retrouver le contexte plus tard.",
    "Commencez petit. Transformer un article, un PDF ou une vidéo en carte de structure suffit pour sentir la différence entre un court résumé et une structure de connaissance réutilisable.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "what-is-ai-mindmap",
    slug: "quest-ce-quune-carte-mentale-ia",
    title: "Qu'est-ce qu'une carte mentale IA et comment l'utiliser ?",
    excerpt:
      "Découvrez ce qu'est une carte mentale IA et comment elle peut aider à organiser articles longs, documents, cours, vidéos YouTube et notes de recherche.",
    seo_keywords: ["carte mentale IA", "outil carte mentale IA", "carte mentale automatique", "mind map IA", ...commonKeywords],
    intro:
      "Une carte mentale IA n'est pas seulement un outil qui dessine automatiquement de belles branches. C'est surtout une façon de transformer des informations complexes, comme de longs articles, documents, cours, vidéos ou notes, en structure compréhensible d'un seul coup d'oeil.",
    sections: [
      { heading: "Pourquoi les cartes mentales IA sont utiles", paragraphs: ["Plus une source devient longue, plus il est difficile de garder tout son fil en tête.", "Une carte mentale IA aide à séparer rapidement le sujet principal des idées secondaires pour voir la structure globale."] },
      { heading: "Différence avec une carte mentale classique", paragraphs: ["Une carte mentale classique demande souvent à l'utilisateur de créer et d'organiser lui-même les branches.", "Une carte mentale IA commence par extraire les thèmes répétés, concepts clés et relations depuis la source."] },
      { heading: "Quels contenus transformer en carte mentale ?", paragraphs: ["Articles longs, PDF, documents de réunion, notes de cours, transcriptions YouTube et résumés de recherche peuvent être structurés.", "L'important n'est pas le type de fichier, mais la possibilité de séparer clairement les idées et leurs relations."] },
      { heading: "Résumé ou carte mentale ?", paragraphs: ["Un résumé raccourcit le contenu.", "Une carte mentale montre comment les idées se relient, ce qui rend le contenu plus facile à revoir et à expliquer."] },
      { heading: "Pourquoi Brify privilégie les cartes de structure IA", paragraphs: ["Brify combine la clarté visuelle d'une carte mentale et l'utilité pratique de la structuration de documents.", "Au lieu de s'arrêter à une carte simple, il garde les preuves et les relations visibles dans une carte de structure IA."] },
    ],
    closing:
      "Une carte mentale IA est un point de départ pour rendre une information complexe compréhensible. Avec Brify, transformez vos contenus longs en cartes de structure IA réellement réutilisables.",
  },
  {
    koSlug: "ai-structure-map-vs-ai-mindmap",
    slug: "carte-structure-ia-vs-carte-mentale-ia",
    title: "Carte de structure IA ou carte mentale IA : quelle différence ?",
    excerpt:
      "Comparez carte de structure IA et carte mentale IA, et découvrez pourquoi la structure peut compter davantage qu'un simple résumé.",
    seo_keywords: ["carte de structure IA", "carte de structure", "structuration IA", "structure carte mentale", ...commonKeywords],
    intro:
      "Les cartes mentales IA et les cartes de structure IA peuvent se ressembler, mais elles ne servent pas exactement au même objectif. Une carte mentale développe les idées, tandis qu'une carte de structure conserve la logique et les preuves d'un contenu source.",
    sections: [
      { heading: "La carte mentale développe les idées", paragraphs: ["Une carte mentale est utile pour partir d'un sujet central et ouvrir des branches.", "Elle convient bien au brainstorming, à l'exploration de concepts et à la vue rapide d'idées liées."] },
      { heading: "La carte de structure conserve les relations", paragraphs: ["Une carte de structure réorganise un contenu existant en relations vérifiables.", "Elle montre comment idées, preuves, exemples et conditions se connectent."] },
      { heading: "Quand le résumé ne suffit pas", paragraphs: ["Un résumé se lit vite, mais peut cacher l'origine des preuves ou le fil logique.", "Rapports, cours et contenus de recherche demandent souvent une structure parce qu'il faudra les vérifier plus tard."] },
      { heading: "Garder logique, preuves et exemples ensemble", paragraphs: ["Si seule la conclusion reste, il devient difficile de savoir pourquoi elle a été atteinte.", "Quand les preuves et exemples restent liés, le contenu devient plus sûr à réutiliser."] },
      { heading: "Comment Brify utilise les cartes de structure IA", paragraphs: ["Brify ne réduit pas les contenus longs à un seul résumé.", "Il les transforme en carte de structure pour permettre une lecture rapide tout en gardant les preuves visibles."] },
    ],
    closing:
      "Une carte de structure IA va plus loin qu'une carte mentale agréable à regarder. Elle rend un contenu plus facile à vérifier, expliquer et réutiliser.",
  },
  {
    koSlug: "turn-text-into-mindmap",
    slug: "transformer-texte-en-carte-mentale",
    title: "Comment transformer un texte en carte mentale",
    excerpt:
      "Apprenez à transformer un texte long en carte mentale en séparant sujets principaux, sous-thèmes, preuves, exemples et actions.",
    seo_keywords: ["texte en carte mentale", "transformer texte en carte mentale", "carte mentale texte", "générateur carte mentale automatique", ...commonKeywords],
    intro:
      "Transformer un texte ou des notes en carte mentale peut rendre le contenu beaucoup plus facile à comprendre. L'objectif n'est pas seulement de raccourcir les phrases, mais de faire apparaître les relations cachées entre elles.",
    sections: [
      { heading: "Pourquoi transformer un texte en carte mentale ?", paragraphs: ["Un texte long doit souvent être lu du début à la fin avant que son fil devienne clair.", "Une carte mentale permet de voir le sujet central et les points de soutien en même temps."] },
      { heading: "Commencer par la question principale", paragraphs: ["Avant de structurer un texte, demandez quelle question il essaie de résoudre.", "Cette question aide à distinguer les paragraphes centraux des détails secondaires."] },
      { heading: "Regrouper les paragraphes par rôle", paragraphs: ["Si vous déplacez chaque paragraphe tel quel dans une carte, le résultat devient confus.", "Il vaut mieux séparer thème, preuve, exemple, conclusion et action."] },
      { heading: "Relier preuves et exemples", paragraphs: ["Une bonne structure montre comment une preuve soutient l'idée principale.", "Les exemples doivent rester reliés à l'idée qu'ils expliquent."] },
      { heading: "Créer une carte de structure dans Brify", paragraphs: ["Brify aide à transformer textes copiés, notes ou brouillons en cartes de structure.", "Vos anciennes notes deviennent plus faciles à revoir, réécrire et réutiliser."] },
    ],
    closing:
      "Une carte mentale de texte sert à comprendre à nouveau un long contenu plus tard. Brify rend visibles les relations à l'intérieur du texte.",
  },
  {
    koSlug: "turn-writing-into-mindmap",
    slug: "transformer-redaction-en-carte-mentale",
    title: "Pourquoi transformer votre texte en carte mentale ?",
    excerpt:
      "Transformer un texte en carte mentale aide à voir le fil des idées, les faiblesses logiques, les répétitions et les preuves manquantes.",
    seo_keywords: ["transformer texte en carte mentale", "structure de texte", "résumé carte mentale", "outil organisation texte", ...commonKeywords],
    intro:
      "Transformer votre propre texte en carte mentale ne le rend pas seulement plus lisible. Cela peut révéler le fil de l'argument, les répétitions, les preuves manquantes et les liens faibles.",
    sections: [
      { heading: "Pourquoi un long texte est difficile à voir clairement", paragraphs: ["Un texte se lit ligne par ligne, donc sa structure entière reste difficile à percevoir.", "Les brouillons deviennent vite flous lorsque les paragraphes sont longs ou répétitifs."] },
      { heading: "Trouver l'idée principale", paragraphs: ["Avant de cartographier un brouillon, identifiez l'idée centrale qu'il veut défendre.", "Si cette idée est floue, les paragraphes de soutien seront difficiles à organiser."] },
      { heading: "Repérer répétitions et preuves manquantes", paragraphs: ["Une fois le brouillon ouvert comme structure, les répétitions deviennent plus visibles.", "Vous voyez aussi les conclusions qui manquent de preuves."] },
      { heading: "Vérifier la structure avant le style", paragraphs: ["Il vaut souvent mieux vérifier la structure avant de polir les phrases.", "Une carte montre quels paragraphes fusionner, déplacer ou renforcer."] },
      { heading: "Utiliser Brify pour contrôler le fil", paragraphs: ["Brify aide à diviser un texte en idée principale, sous-thèmes, preuves et exemples.", "C'est utile avant de réécrire un brouillon ou de préparer une présentation."] },
    ],
    closing:
      "Une carte mentale peut montrer les faiblesses d'un texte avant le travail de style. Brify permet d'ouvrir un brouillon comme carte de structure.",
  },
  {
    koSlug: "organize-documents-as-mindmap",
    slug: "organiser-documents-en-carte-mentale",
    title: "La manière la plus simple d'organiser des documents en carte mentale",
    excerpt:
      "Organisez rapports, propositions et documents de réunion en cartes mentales en séparant objectif, conclusion, preuves, conditions et actions.",
    seo_keywords: ["carte mentale document", "structure document", "organisation document carte mentale", "organisateur document IA", ...commonKeywords],
    intro:
      "Organiser un document en carte mentale peut rendre un rapport ou une proposition beaucoup plus facile à parcourir. Mais une bonne carte de document doit garder la conclusion, les preuves et les conditions ensemble.",
    sections: [
      { heading: "Résumé de document ou carte mentale de document", paragraphs: ["Un résumé présente le contenu sous une forme plus courte.", "Une carte mentale de document montre comment objectif, conclusion, preuves et conditions se relient."] },
      { heading: "Commencer par l'objectif et la conclusion", paragraphs: ["Avant de structurer un document, demandez ce qu'il cherche à expliquer ou décider.", "Quand l'objectif et la conclusion sont clairs, le reste devient plus facile à prioriser."] },
      { heading: "Séparer preuves, conditions et exceptions", paragraphs: ["Une conclusion est plus fiable quand ses preuves et conditions restent visibles.", "Les exceptions et limites doivent aussi être marquées pour éviter une mauvaise réutilisation."] },
      { heading: "Transformer en structure de réunion ou de rapport", paragraphs: ["Les documents de travail mènent souvent à une discussion ou une décision.", "Ajouter enjeux, risques et prochaines actions rend la carte plus utile en réunion."] },
      { heading: "Créer des cartes de document dans Brify", paragraphs: ["Brify transforme les documents en cartes de structure réutilisables plutôt qu'en simples paragraphes de résumé.", "Cela aide à comprendre plus vite rapports, propositions et supports de réunion."] },
    ],
    closing:
      "Une carte mentale de document doit garder conclusions et preuves ensemble. Brify transforme les documents en structures que vous pouvez relire et réutiliser.",
  },
  {
    koSlug: "turn-summary-into-mindmap",
    slug: "transformer-resume-en-carte-mentale",
    title: "Pourquoi transformer un résumé en carte mentale",
    excerpt:
      "Transformer un résumé IA en carte mentale rend idées, preuves, exemples et points à vérifier plus faciles à examiner.",
    seo_keywords: ["carte mentale résumé", "structure de résumé", "organiser résumé", "carte mentale résumé IA", ...commonKeywords],
    intro:
      "Même avec un résumé IA, le résultat peut rester difficile à réutiliser plus tard. Un résumé se lit vite, mais il peut cacher les relations entre idées et preuves.",
    sections: [
      { heading: "Pourquoi un résumé peut rester difficile à réutiliser", paragraphs: ["Les résumés sont souvent écrits en paragraphes continus.", "Ils sont plus courts que la source, mais ne montrent pas toujours ce qui est central ou à vérifier."] },
      { heading: "Séparer idées et preuves", paragraphs: ["Pour transformer un résumé en carte mentale, commencez par séparer conclusions et preuves.", "Cela permet de juger plus facilement si le résumé est fiable."] },
      { heading: "Marquer exemples manquants et points à vérifier", paragraphs: ["Les résumés IA peuvent omettre des exemples ou conditions.", "Une carte mentale donne un endroit pour marquer ce qu'il faut vérifier dans la source."] },
      { heading: "Transformer le résumé en présentation ou rapport", paragraphs: ["Un résumé seul peut paraître plat dans une présentation.", "Une carte de structure aide à réorganiser conclusions, preuves, exemples et actions."] },
      { heading: "Créer des cartes de résumé dans Brify", paragraphs: ["Brify aide à traiter un résumé IA comme point de départ, pas comme réponse finale.", "Vous pouvez restructurer le résumé, vérifier les points faibles et le rendre réutilisable."] },
    ],
    closing:
      "Un résumé est un point de départ, tandis qu'une carte mentale sert à vérifier et réutiliser. Brify transforme les résumés IA en structures plus claires.",
  },
  {
    koSlug: "pdf-to-mindmap-checklist",
    slug: "pdf-en-carte-mentale-checklist",
    title: "Que vérifier quand on transforme un PDF en carte mentale",
    excerpt:
      "Quand vous transformez un PDF en carte mentale, vérifiez tableaux, figures, notes, annexes et conditions pour garder une structure fiable.",
    seo_keywords: ["PDF carte mentale", "structure PDF", "résumé PDF carte mentale", "organisateur PDF IA", ...commonKeywords],
    intro:
      "Transformer un PDF en carte mentale peut rendre un document long beaucoup plus facile à comprendre. Mais un PDF n'est pas seulement du texte: tableaux, figures, notes et annexes doivent aussi être pris en compte.",
    sections: [
      { heading: "Un PDF n'est pas seulement du texte", paragraphs: ["Un PDF peut contenir texte, tableaux, graphiques, encadrés, notes et annexes.", "Certaines preuves importantes peuvent se trouver hors des paragraphes principaux."] },
      { heading: "Intégrer tableaux et figures", paragraphs: ["Les tableaux et figures soutiennent souvent la conclusion principale.", "Les marquer séparément dans la carte facilite la vérification du document."] },
      { heading: "Vérifier notes et annexes", paragraphs: ["Les notes et annexes semblent secondaires, mais elles contiennent souvent des conditions d'interprétation.", "Les oublier peut mener à une mauvaise utilisation du PDF."] },
      { heading: "Relire le résumé PDF comme une carte", paragraphs: ["Un résumé PDF seul ne montre pas toujours ce qui a été omis.", "Une carte mentale permet de vérifier séparément texte, tableaux, conditions et annexes."] },
      { heading: "Créer des cartes PDF dans Brify", paragraphs: ["Brify convient aux workflows où les PDF ne sont pas réduits à un seul paragraphe.", "Il aide à garder les PDF longs sous une forme vérifiable plus tard."] },
    ],
    closing:
      "Une carte mentale de PDF doit inclure plus que le texte principal. Brify structure les PDF en gardant visibles preuves et conditions.",
  },
  {
    koSlug: "youtube-video-to-mindmap",
    slug: "transformer-video-youtube-en-carte-mentale",
    title: "Comment transformer une vidéo YouTube en carte mentale",
    excerpt:
      "Transformez une vidéo YouTube en carte mentale en organisant question clé, sections, idées, exemples et passages à revoir.",
    seo_keywords: ["carte mentale YouTube", "carte mentale vidéo", "résumé YouTube carte mentale", "carte mentale vidéo de cours", ...commonKeywords],
    intro:
      "Les vidéos YouTube sont faciles à sauvegarder, mais difficiles à retrouver. Les transformer en carte mentale aide à garder dans une même structure la question clé, les sections importantes, les exemples et les passages à revoir.",
    sections: [
      { heading: "Pourquoi les vidéos ont besoin de structure", paragraphs: ["Une vidéo avance dans le temps, donc une information précise peut être difficile à retrouver.", "La structurer permet de revisiter le contenu par thème plutôt que seulement par chronologie."] },
      { heading: "Utiliser sous-titres et chapitres", paragraphs: ["Les sous-titres et chapitres YouTube sont de bons points de départ.", "Les mots répétés et transitions révèlent souvent les sections importantes."] },
      { heading: "Séparer idées, exemples et passages à revoir", paragraphs: ["Une idée se rapproche de la conclusion de la vidéo, tandis qu'un exemple l'explique.", "Les passages à revoir doivent être gardés avec timestamps ou questions."] },
      { heading: "Organiser les vidéos de cours par concepts", paragraphs: ["Les vidéos de cours demandent une structure plus centrée sur les concepts.", "Définitions, exemples, questions et points de révision doivent rester liés."] },
      { heading: "Créer une carte YouTube dans Brify", paragraphs: ["Brify permet de garder question clé, idées, exemples et passages à revoir dans une carte de structure.", "La vidéo devient plus facile à réviser ou à utiliser comme source."] },
    ],
    closing:
      "Une carte mentale YouTube sert à retrouver et réviser les connaissances d'une vidéo. Brify transforme les vidéos en cartes que vous pouvez revisiter.",
  },
  {
    koSlug: "ai-mindmap-tool-checklist",
    slug: "choisir-outil-carte-mentale-ia",
    title: "Comment choisir un outil de carte mentale IA",
    excerpt:
      "Choisissez un outil de carte mentale IA en vérifiant types d'entrée, qualité de structure, édition, vérification des sources et partage.",
    seo_keywords: ["outil carte mentale IA", "générateur carte mentale IA", "outil carte mentale automatique", "outil de structuration", ...commonKeywords],
    intro:
      "Pour choisir un outil de carte mentale IA, il ne suffit pas de regarder si le résultat est joli. Il faut savoir quels contenus l'outil accepte, si la structure est correcte et si vous pouvez vérifier et modifier le résultat.",
    sections: [
      { heading: "Pourquoi une jolie carte ne suffit pas", paragraphs: ["Une carte visuellement agréable peut rester faible si sa structure logique est mauvaise.", "Pour étudier ou travailler, les relations entre preuves et conclusions doivent rester visibles."] },
      { heading: "Vérifier les types d'entrée", paragraphs: ["Un bon outil doit gérer textes, documents, PDF, résumés vidéo et autres sources.", "Si les entrées sont limitées, les cas d'usage le sont aussi."] },
      { heading: "Vérifier si la structure a du sens", paragraphs: ["Relisez les branches créées par l'IA pour voir si elles sont regroupées logiquement.", "Si une conclusion importante est enterrée comme petit exemple ou si une preuve manque, la carte doit être corrigée."] },
      { heading: "Vérifier édition et sources", paragraphs: ["Une carte mentale IA doit être traitée comme un brouillon.", "Vous devez pouvoir la modifier et vérifier la source originale avant de l'utiliser comme matériau fiable."] },
      { heading: "Pourquoi Brify convient à la structuration", paragraphs: ["Brify transforme les résumés en cartes de structure vérifiables et réutilisables.", "Il privilégie une structure utile plutôt qu'un simple effet visuel."] },
    ],
    closing:
      "Un outil de carte mentale IA doit fournir une structure vérifiable, pas seulement un résultat esthétique. Brify est conçu pour résumer, structurer et réutiliser.",
  },
  {
    koSlug: "check-ai-generated-mindmap",
    slug: "verifier-carte-mentale-generee-par-ia",
    title: "Pourquoi vérifier les cartes mentales générées par IA",
    excerpt:
      "Les cartes mentales générées par IA doivent être vérifiées pour preuves manquantes, mauvais regroupements, conclusions exagérées et sources.",
    seo_keywords: ["vérifier carte mentale IA", "vérifier résumé IA", "erreurs carte mentale", "erreurs structuration IA", ...commonKeywords],
    intro:
      "Les cartes mentales générées par IA sont rapides et pratiques, mais elles ne remplacent pas votre compréhension. L'IA peut mal regrouper des sujets, oublier des preuves ou rendre une conclusion plus forte qu'elle ne l'est.",
    sections: [
      { heading: "Une carte mentale IA est un brouillon", paragraphs: ["L'IA peut classer rapidement un contenu et créer une première structure.", "Cette structure doit tout de même être relue selon votre objectif."] },
      { heading: "Vérifier les mauvais regroupements", paragraphs: ["L'IA peut regrouper des idées parce qu'elles utilisent des mots similaires.", "Si les sens sont différents, la structure devient trompeuse."] },
      { heading: "Chercher preuves et exemples manquants", paragraphs: ["Des preuves ou exemples importants peuvent disparaître de la carte.", "Si une conclusion reste sans soutien, revenez à la source originale."] },
      { heading: "Se méfier des conclusions trop fortes", paragraphs: ["L'IA peut transformer une formule prudente en affirmation plus catégorique.", "C'est important pour les rapports, notes d'étude et décisions de travail."] },
      { heading: "Relire les cartes de structure dans Brify", paragraphs: ["Brify permet de modifier et vérifier les structures générées par IA.", "Garder les preuves et points de vérification visibles rend la carte plus sûre."] },
    ],
    closing:
      "Une carte mentale IA est un brouillon rapide, pas une vérité à accepter sans vérifier. Brify aide à relire et améliorer la structure avant de s'y appuyer.",
  },
  {
    koSlug: "use-ai-mindmap-for-study",
    slug: "utiliser-carte-mentale-ia-pour-etudier",
    title: "Comment utiliser les cartes mentales IA pour étudier",
    excerpt:
      "Utilisez les cartes mentales IA pour étudier en organisant concepts, définitions, exemples, questions et points de révision.",
    seo_keywords: ["carte mentale IA pour étudier", "carte mentale étude", "notes d'étude IA", "carte mentale concepts", ...commonKeywords],
    intro:
      "Utiliser des cartes mentales IA pour étudier peut rendre les notes de cours et lectures longues plus faciles à revoir. Mais une carte d'étude doit faire plus qu'être jolie: elle doit soutenir la mémoire et la compréhension.",
    sections: [
      { heading: "Pourquoi les cartes mentales aident à étudier", paragraphs: ["Les contenus d'étude deviennent plus difficiles à mémoriser avec le temps.", "Une carte mentale aide à retrouver les relations entre concepts sans tout relire."] },
      { heading: "Séparer concepts et exemples", paragraphs: ["Si concepts et exemples sont mélangés, la révision devient confuse.", "Placez le concept d'abord, puis reliez les exemples dessous."] },
      { heading: "Transformer la confusion en questions", paragraphs: ["Dans l'étude, les parties floues sont aussi importantes que les parties comprises.", "Les noeuds de question rendent la prochaine révision plus ciblée."] },
      { heading: "Créer un ordre de révision", paragraphs: ["Une carte mentale aide aussi à déterminer l'ordre de révision.", "Vous pouvez passer des concepts de base aux exemples appliqués."] },
      { heading: "Créer des cartes d'étude dans Brify", paragraphs: ["Brify transforme notes de cours, documents et résumés en cartes centrées sur les concepts.", "Lors de la révision, vous retrouvez le fil sans relire tout le matériel."] },
    ],
    closing:
      "Une carte mentale IA pour étudier doit aider la mémoire, la révision et l'explication. Brify relie concepts, exemples et questions dans une vraie structure d'étude.",
  },
  {
    koSlug: "use-ai-structure-map-for-work",
    slug: "utiliser-carte-structure-ia-au-travail",
    title: "Comment utiliser les cartes de structure IA au travail",
    excerpt:
      "Utilisez les cartes de structure IA au travail pour organiser réunions, rapports, propositions et recherches en conclusions, preuves, enjeux et actions.",
    seo_keywords: ["structuration IA travail", "carte mentale travail", "structure document réunion", "carte structure rapport", ...commonKeywords],
    intro:
      "Au travail, organiser l'information ne s'arrête pas à la comprendre. Documents de réunion, rapports, propositions et recherches doivent souvent mener à une décision ou à une prochaine action.",
    sections: [
      { heading: "Quand le travail a besoin de structuration", paragraphs: ["La structuration est utile quand les supports de réunion sont trop longs ou quand conclusion et preuves sont dispersées.", "Elle aide aussi lorsque des propositions ou notes de recherche contiennent des enjeux difficiles à voir."] },
      { heading: "Séparer conclusions et preuves", paragraphs: ["Les documents de travail deviennent plus clairs quand conclusions et preuves sont séparées.", "Une conclusion sans preuve est faible, tandis qu'une preuve sans direction est difficile à utiliser."] },
      { heading: "Marquer enjeux et risques", paragraphs: ["Une bonne carte de travail montre aussi les enjeux et les risques.", "Cela aide l'équipe à savoir quoi discuter avant une décision."] },
      { heading: "Relier la carte aux prochaines actions", paragraphs: ["Une carte de structure de travail doit finir par des actions.", "Indiquer qui doit vérifier, décider ou préparer quelque chose rend l'information plus opérationnelle."] },
      { heading: "Créer des cartes de travail dans Brify", paragraphs: ["Brify aide à organiser documents de réunion, rapports et propositions en conclusions, preuves, enjeux et actions.", "Il transforme l'information en structure capable de soutenir une décision."] },
    ],
    closing:
      "Une carte de structure IA au travail doit rendre conclusions et prochaines actions claires. Brify transforme les documents complexes en structures utiles pour décider.",
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
