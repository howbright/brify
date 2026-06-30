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
  "organiser les documents pour un rapport",
  "résumer des documents pour un devoir",
  "organisation des sources de devoir",
  "résumé de documents pour rapport",
  "structurer des documents d'étude",
  "carte de structure IA",
  "Brify",
];

function buildMarkdown(post) {
  return [
    post.intro,
    ...post.sections.map((section) => [`## ${section.heading}`, ...section.paragraphs].join("\n\n")),
    "## Transformer les documents en structure prête à rendre dans Brify",
    `Le point essentiel dans ${post.title} est que collecter des documents et bien les utiliser sont deux choses différentes. Un rapport ou un devoir n'est pas une liste de sources. Il doit montrer comment vous comprenez la question, quelles affirmations vous formulez et quelles preuves les soutiennent.`,
    "Dans Brify, vous pouvez organiser les documents en carte de structure avec des noeuds comme question du devoir, idée principale, source utilisée, point de citation, interprétation personnelle, plan possible et phrases à réutiliser pour le rapport ou la présentation. Cela évite qu'un résumé IA devienne trop vite la réponse finale.",
    "Quand plusieurs sources sont utilisées, les citations se mélangent facilement, les idées similaires se répètent et la preuve vraiment nécessaire peut manquer. Une carte de structure aide à voir quelle source soutient quelle affirmation, où sont les vides et ce qui doit être retiré avant la rédaction.",
    "## Quand une carte de structure aide le plus",
    "Une carte de structure devient particulièrement utile quand vous avez assez de documents mais n'arrivez pas à construire un plan de rapport, quand un résumé IA existe mais que vous ne savez plus ce qui vient de la source et ce qui relève de votre interprétation, ou quand les documents d'un travail de groupe sont dispersés entre messages, fichiers et liens.",
    "Elle aide aussi juste avant le rendu, quand il faut retrouver les citations. À ce moment-là, plus de résumé n'est généralement pas la solution. Il faut surtout une connexion claire entre question, affirmations, preuves et sources.",
    "## Checklist avant de rendre",
    `Si vous travaillez aujourd'hui sur ${post.seo_keywords[0]}, vérifiez quatre points: ce document répond-il directement à la question du devoir, chaque affirmation a-t-elle une preuve et une source, le résumé de la source et votre interprétation sont-ils séparés, et la structure peut-elle devenir un plan de rapport ou une présentation ?`,
    "Si ces quatre éléments ne sont pas visibles, le contenu n'est pas encore vraiment prêt à être rendu. Le transformer en carte de structure Brify relie compréhension, vérification des citations, construction du plan et préparation de présentation dans un seul flux.",
    "## Pour conclure",
    post.closing,
  ].join("\n\n");
}

const posts = [
  {
    koSlug: "organize-report-materials",
    slug: "organiser-documents-rapport",
    title: "Comment organiser les documents d'un rapport quand on ne sait pas par où commencer",
    excerpt:
      "Organiser les documents d'un rapport ne signifie pas collecter plus de sources, mais les classer par sujet, affirmation, preuve, citation et plan.",
    seo_keywords: ["organiser les documents pour un rapport", "organisation documents rapport", "comment organiser un rapport", "organiser sources rapport", ...commonKeywords],
    intro:
      "L'organisation des documents d'un rapport devient souvent difficile non pas parce que les sources manquent, mais parce qu'il y en a trop. Vous avez peut-être enregistré des pages web, PDF, articles, supports de cours et extraits de textes académiques, mais au moment d'écrire la première phrase, tout semble confus. La prochaine étape n'est alors pas de chercher davantage, mais de réorganiser ce que vous avez déjà autour de la question du rapport.",
    sections: [
      {
        heading: "Pourquoi les documents d'un rapport deviennent difficiles à organiser",
        paragraphs: [
          "Quand vous collectez des documents, vous avancez souvent par mots-clés. Quand vous rédigez un rapport, vous devez avancer par questions et affirmations. Une longue liste de sources enregistrées ne crée pas automatiquement une structure de rapport.",
          "Beaucoup de personnes pensent être organisées parce qu'elles ont des noms de fichiers, des liens ou des titres. Mais un rapport a surtout besoin de savoir ce que chaque source peut soutenir, quelles preuves elle fournit et jusqu'où elle est fiable.",
        ],
      },
      {
        heading: "Commencer par écrire la question du rapport en une phrase",
        paragraphs: [
          "Avant de tout relire, écrivez en une phrase la question à laquelle votre rapport doit répondre. Par exemple, une question comme 'Comment les outils de résumé IA changent-ils la façon d'étudier ?' donne un filtre pour décider ce qui compte.",
          "Sans question claire, toutes les sources semblent importantes. Avec une question claire, il devient plus facile de séparer contexte, preuve centrale, contre-argument et conclusion.",
        ],
      },
      {
        heading: "Classer les sources en affirmations, preuves, exemples et contexte",
        paragraphs: [
          "Pour organiser des documents de rapport, le classement par rôle est plus utile qu'un résumé isolé de chaque source. Certaines sources servent au contexte, d'autres soutiennent l'idée principale, d'autres fonctionnent comme exemples ou contrepoints.",
          "Quand chaque source a un rôle, vous voyez où elle peut entrer dans le rapport. Elle cesse d'être un simple résumé et devient une matière de rédaction.",
        ],
      },
      {
        heading: "Garder les points de citation séparés",
        paragraphs: [
          "L'une des choses les plus faciles à perdre pendant l'organisation est la source. Si vous copiez seulement un résumé, vous pouvez oublier plus tard de quel document ou de quelle page il vient.",
          "À chaque lecture, conservez le titre, l'auteur ou l'institution, l'URL ou la page, ainsi que la phrase que vous pourriez citer. Cela fait gagner beaucoup de temps avant le rendu.",
        ],
      },
      {
        heading: "Créer une carte des documents du rapport dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez placer la question du rapport au centre et relier autour d'elle affirmations, preuves, citations, exemples et contre-arguments. Une liste de fichiers devient alors une structure logique.",
          "Avant la rédaction, la carte aide à voir quelles affirmations manquent de preuves, quelles sources se répètent et où les citations sont absentes.",
        ],
      },
    ],
    closing:
      "Organiser les documents d'un rapport n'est pas une course à la quantité. Si vous construisez d'abord dans Brify une structure question, affirmation, preuve et citation, l'écriture se bloque beaucoup moins.",
  },
  {
    koSlug: "summarize-assignment-materials",
    slug: "resumer-documents-devoir",
    title: "Comment transformer des résumés de documents en rédaction personnelle",
    excerpt:
      "Résumer des documents pour un devoir doit mener à la question du devoir, votre interprétation, les citations et une structure de rédaction.",
    seo_keywords: ["résumer des documents pour un devoir", "méthode résumé devoir", "organiser documents devoir", "résumé devoir universitaire", ...commonKeywords],
    intro:
      "Résumer des documents pour un devoir ne consiste pas simplement à raccourcir un long texte. Dans un devoir, on évalue souvent votre capacité à comprendre le contenu, à le relier à la question posée et à l'expliquer avec vos propres mots. Un résumé IA ou un résumé de source doit donc être restructuré avant d'entrer dans le rendu final.",
    sections: [
      {
        heading: "Un résumé de devoir n'est pas un simple résumé",
        paragraphs: [
          "Un simple résumé réduit les points principaux d'une source. Un résumé pour devoir demande aussi quelles parties répondent à la question, lesquelles soutiennent votre affirmation et où la source doit être citée.",
          "La même source peut être utile de plusieurs façons selon le sujet. Un bon résumé n'est pas une miniature équilibrée de toute la source, mais une sélection ciblée de ce dont le devoir a besoin.",
        ],
      },
      {
        heading: "Choisir uniquement ce qui correspond à la question",
        paragraphs: [
          "Gardez la question du devoir à côté de vous pendant le résumé. Les informations de contexte qui ne répondent pas directement à la question peuvent être raccourcies, tandis que les affirmations et preuves utiles doivent rester plus détaillées.",
          "Sans cette étape, le résumé peut sembler propre mais ne pas convenir au devoir final.",
        ],
      },
      {
        heading: "Séparer résumé de source et interprétation personnelle",
        paragraphs: [
          "Un risque fréquent dans un devoir est de mélanger ce que la source dit et ce que vous en pensez. Séparez les faits, l'affirmation de l'auteur et votre interprétation.",
          "C'est encore plus important avec des résumés IA. Un texte généré est un brouillon, pas une source. Il faut confirmer le contenu original et garder votre interprétation à part.",
        ],
      },
      {
        heading: "Vérifier avant de transformer en texte final",
        paragraphs: [
          "Avant de transformer un résumé en rédaction finale, vérifiez la source, les termes, les preuves et le lien avec la question du devoir. Vérifiez aussi si vous pouvez expliquer l'idée avec vos propres mots.",
          "Une phrase finale doit être naturelle, mais cela ne suffit pas. Il doit être clair quelle source la soutient.",
        ],
      },
      {
        heading: "Utiliser Brify pour reconstruire votre structure",
        paragraphs: [
          "Dans Brify, vous pouvez garder le résumé de source, votre interprétation et les idées de rédaction finale comme des noeuds séparés. Cela évite de mélanger lecture et rédaction.",
          "Quand la question du devoir est au centre, il devient plus facile de décider ce qui appartient à l'introduction, au développement ou à la conclusion.",
        ],
      },
    ],
    closing:
      "Résumer des documents pour un devoir est un début, pas une fin. Séparer source, interprétation et structure dans Brify rend le devoir final plus sûr et plus solide.",
  },
  {
    koSlug: "make-report-outline-from-materials",
    slug: "construire-plan-rapport-documents",
    title: "Comment construire un plan de rapport à partir de vos documents",
    excerpt:
      "Un plan de rapport ne doit pas suivre l'ordre des sources. Réorganisez les documents en problème, contexte, preuves, analyse et conclusion.",
    seo_keywords: ["construire plan de rapport", "plan rapport à partir des sources", "méthode structure rapport", "faire plan rapport", ...commonKeywords],
    intro:
      "Il arrive d'avoir lu assez de documents et de ne toujours pas réussir à créer un plan de rapport. Cela ne signifie pas forcément que les sources sont mal comprises. Le plus souvent, le problème vient du fait que l'ordre de découverte ou de lecture est confondu avec l'ordre que le rapport doit suivre.",
    sections: [
      {
        heading: "Pourquoi le plan n'apparaît pas tout seul",
        paragraphs: [
          "L'ordre de lecture dépend des résultats de recherche, de la difficulté et de vos intérêts. Un plan de rapport doit suivre la logique qui aide le lecteur à comprendre votre réponse.",
          "Si chaque résumé de source devient une section, le rapport paraît souvent dispersé. Le lecteur veut surtout comprendre comment l'argument avance.",
        ],
      },
      {
        heading: "L'ordre des sources et l'ordre du rapport sont différents",
        paragraphs: [
          "La première source lue n'a pas besoin de devenir l'introduction. Une statistique ou un exemple trouvé plus tard peut mieux ouvrir le problème.",
          "Pour construire le plan, oubliez l'ordre de vos fichiers et réorganisez tout autour de la question à laquelle vous répondez.",
        ],
      },
      {
        heading: "Utiliser problème, contexte, preuve et analyse",
        paragraphs: [
          "Une structure de départ utile est problème, contexte, idée principale, preuve, analyse, limite et conclusion. Le rapport final peut changer, mais cette base donne une première carte stable.",
          "Quand vous reliez les sources à chaque section, les vides apparaissent. Il peut y avoir trop de contexte et pas assez de preuves, ou beaucoup d'exemples mais peu d'analyse.",
        ],
      },
      {
        heading: "Repérer les documents manquants ou excessifs",
        paragraphs: [
          "Un plan montre où vos documents manquent et où ils sont trop nombreux. Certaines sections peuvent contenir trop de sources, d'autres aucune preuve.",
          "À ce stade, décidez s'il faut chercher plus, supprimer du contenu inutile ou déplacer une source vers une meilleure section.",
        ],
      },
      {
        heading: "Créer des plans possibles dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez créer des noeuds de plan et relier les sources pertinentes sous chacun. Voir plan et preuves ensemble rend l'équilibre plus facile à juger.",
          "Avant d'écrire, vous pouvez modifier l'ordre des sections et renforcer les parties faibles dans la carte.",
        ],
      },
    ],
    closing:
      "Un plan de rapport ne sort pas automatiquement des sources. Construisez d'abord dans Brify le flux problème, preuves, analyse et conclusion, puis la rédaction suivra plus naturellement.",
  },
  {
    koSlug: "connect-claims-and-evidence-for-reports",
    slug: "relier-affirmations-preuves-rapport",
    title: "Comment relier affirmations et preuves dans un rapport",
    excerpt:
      "Un rapport convaincant a besoin d'affirmations, de preuves, d'exemples et de sources organisés ensemble avant la rédaction.",
    seo_keywords: ["organiser preuves rapport", "relier affirmations et preuves", "affirmation preuve rapport", "trouver preuve devoir", ...commonKeywords],
    intro:
      "Un rapport peut paraître faible même si les phrases sont bien écrites. Le problème le plus fréquent est que les affirmations et les preuves ne sont pas clairement reliées. Si le lecteur ne voit pas ce qui soutient chaque affirmation, le rapport perd sa force, même avec un style soigné.",
    sections: [
      {
        heading: "Pourquoi les rapports paraissent vagues",
        paragraphs: [
          "Beaucoup de rapports contiennent des résumés de sources mais des affirmations faibles, ou des affirmations fortes mais peu de preuves. Quand source et argument avancent séparément, le texte s'allonge sans devenir plus convaincant.",
          "Le coeur d'un rapport est de montrer ce que vous affirmez et pourquoi vous pouvez l'affirmer.",
        ],
      },
      {
        heading: "Séparer affirmations et résumés de sources",
        paragraphs: [
          "Un résumé de source est ce que quelqu'un d'autre a dit. Une affirmation est la direction que vous prenez dans votre rapport. Sans séparation, le texte devient une liste de sources.",
          "Essayez d'écrire d'abord l'affirmation de chaque paragraphe en une phrase, puis d'y attacher les sources qui la soutiennent.",
        ],
      },
      {
        heading: "Marquer les phrases et données qui servent de preuves",
        paragraphs: [
          "Une preuve doit être concrète: phrase, statistique, exemple, résultat ou cas documenté. Avec des chiffres, gardez toujours la source et les conditions ensemble.",
          "Pendant la lecture, marquez ce qui pourrait soutenir une affirmation. C'est plus sûr que de tout rechercher la veille du rendu.",
        ],
      },
      {
        heading: "Garder contre-preuves et limites visibles",
        paragraphs: [
          "Un rapport solide ne collecte pas seulement ce qui soutient sa position. Les contre-arguments et limites montrent une compréhension plus fine du sujet.",
          "En les gardant séparés, vous pouvez écrire une conclusion plus équilibrée et répondre plus facilement aux questions en présentation.",
        ],
      },
      {
        heading: "Créer des liens affirmation-preuve dans Brify",
        paragraphs: [
          "Dans Brify, chaque affirmation peut avoir sous elle des preuves, exemples, citations, contrepoints et limites. La force des paragraphes devient visible avant d'écrire.",
          "La carte aide à trouver les affirmations trop fortes pour leurs preuves ou les paragraphes qui ont des preuves mais pas d'idée claire.",
        ],
      },
    ],
    closing:
      "La force d'un rapport vient plus du lien affirmation-preuve que du style. Avant d'écrire, utilisez Brify pour attacher preuves et sources à chaque affirmation.",
  },
  {
    koSlug: "keep-sources-while-summarizing-materials",
    slug: "garder-sources-citations-resumer-documents",
    title: "Comment garder sources et citations en résumant plusieurs documents",
    excerpt:
      "Quand vous résumez plusieurs documents, gardez séparés les résumés, emplacements de source, citations possibles et interprétations.",
    seo_keywords: ["résumer documents avec sources", "organiser sources devoir", "organiser citations rapport", "gestion citations documents", ...commonKeywords],
    intro:
      "Quand vous résumez plusieurs documents, tout semble clair au début. Quelques jours plus tard, vous ne savez plus quelle phrase vient de quelle source, si elle peut être citée ou si elle relève de votre interprétation. Un résumé sans suivi des sources peut affaiblir la fiabilité du devoir final.",
    sections: [
      {
        heading: "Pourquoi les sources se mélangent",
        paragraphs: [
          "Quand plusieurs sources parlent d'un sujet similaire, leurs termes et arguments se répètent. Si vous ne gardez que des résumés, il devient difficile de savoir quelle idée vient de quelle source.",
          "Les résumés IA peuvent renforcer cette confusion, car des sources différentes sont souvent réécrites dans un style similaire.",
        ],
      },
      {
        heading: "Ce qu'il faut garder à côté de chaque résumé",
        paragraphs: [
          "À côté de chaque résumé, gardez le titre, l'auteur ou l'organisme, l'URL ou le nom du fichier, la page ou section et la phrase importante vérifiée. Pour une source web, ne gardez pas seulement le lien: notez pourquoi il compte.",
          "Ces informations rendent aussi la mise en forme des citations beaucoup plus simple. L'organisation des sources doit se faire pendant le résumé, pas seulement à la fin.",
        ],
      },
      {
        heading: "Séparer contenu citable et notes de contexte",
        paragraphs: [
          "Tous les résumés ne doivent pas être cités. Certains servent seulement à comprendre le sujet, d'autres peuvent soutenir un paragraphe précis.",
          "Marquez les notes comme citation possible, contexte ou vérification nécessaire. La relecture finale devient plus simple.",
        ],
      },
      {
        heading: "Séparer interprétation et source originale",
        paragraphs: [
          "Gardez ce que la source dit séparé de ce que vous pensez que cela signifie. Sinon, vous risquez de présenter votre interprétation comme l'affirmation de la source ou l'inverse.",
          "Une séparation simple entre contenu source et interprétation personnelle réduit le risque de plagiat et clarifie le raisonnement.",
        ],
      },
      {
        heading: "Créer une carte avec sources dans Brify",
        paragraphs: [
          "Dans Brify, chaque noeud de preuve peut contenir la source et le point de citation. Garder résumé et source dans la même structure réduit le temps de recherche plus tard.",
          "Vous pouvez aussi rassembler plusieurs sources sous la même affirmation et comparer laquelle fournit la preuve la plus forte.",
        ],
      },
    ],
    closing:
      "Si vous perdez les sources pendant le résumé, la fin devient stressante. Utilisez Brify pour garder ensemble résumé, source et interprétation dès le départ.",
  },
  {
    koSlug: "organize-team-assignment-materials",
    slug: "organiser-documents-travail-groupe",
    title: "Comment organiser des documents dispersés dans un travail de groupe",
    excerpt:
      "Dans un travail de groupe, les documents doivent être réorganisés par thème, rôle, affirmation, preuve et partie de présentation plutôt que par personne.",
    seo_keywords: ["organiser documents travail de groupe", "organisation documents projet groupe", "documents travail équipe", "rapport collaboratif sources", ...commonKeywords],
    intro:
      "La partie la plus difficile d'un travail de groupe n'est souvent pas le manque de documents. C'est leur dispersion. Un membre envoie des liens dans une discussion, un autre écrit dans un document partagé, un autre garde des PDF séparés. Même si tout le monde travaille, le fil du rapport ou de la présentation peut rester flou.",
    sections: [
      {
        heading: "Pourquoi les documents d'équipe se dispersent vite",
        paragraphs: [
          "Dans un projet de groupe, chacun recherche souvent une partie différente. Les documents s'accumulent donc naturellement par personne.",
          "Le rendu final, lui, ne peut pas être un simple paquet de notes individuelles. Il doit avoir un seul flux logique.",
        ],
      },
      {
        heading: "Passer d'une organisation par personne à une organisation par thème",
        paragraphs: [
          "Il est normal de collecter d'abord les documents par membre. Mais dès qu'il y a assez de sources, il faut les réorganiser selon la structure finale: contexte, problème, exemples, solution, limite et conclusion.",
          "Ce changement rend plus clair l'endroit où chaque source sera utilisée.",
        ],
      },
      {
        heading: "Voir ensemble rapport écrit et présentation",
        paragraphs: [
          "Beaucoup de travaux de groupe demandent à la fois un rapport et une présentation. Les deux rendus ne sont pas identiques, mais leurs idées principales doivent rester reliées.",
          "Pendant l'organisation, marquez si une source sert à un paragraphe, une diapositive ou aux deux.",
        ],
      },
      {
        heading: "Repérer doublons et parties manquantes",
        paragraphs: [
          "Quand tous les documents sont placés dans une structure commune, doublons et vides apparaissent. L'équipe peut avoir trop de sources de contexte et pas assez de preuves pour la solution.",
          "La recherche suivante devient alors plus précise et les réunions plus efficaces.",
        ],
      },
      {
        heading: "Partager une structure d'équipe dans Brify",
        paragraphs: [
          "Une carte Brify peut organiser les documents d'équipe par thème, section, preuve et source. Elle transforme des recherches individuelles dispersées en structure commune.",
          "Avant une réunion, relire la carte mène souvent à une meilleure discussion qu'un simple tour d'avancement.",
        ],
      },
    ],
    closing:
      "Organiser les documents d'un travail de groupe ne consiste pas seulement à fusionner des fichiers. Réorganisez les sources par thèmes et sections dans Brify pour voir un flux partagé.",
  },
  {
    koSlug: "turn-assignment-materials-into-presentation",
    slug: "transformer-documents-devoir-presentation",
    title: "Comment transformer des documents de devoir en présentation",
    excerpt:
      "Pour transformer des documents de devoir en présentation, compressez-les en problème, idée principale, preuve, exemple et conclusion.",
    seo_keywords: ["organiser documents présentation", "faire présentation à partir devoir", "transformer rapport en présentation", "structurer contenu présentation", ...commonKeywords],
    intro:
      "Une erreur fréquente consiste à copier directement les paragraphes du rapport dans les diapositives. Un rapport est fait pour être lu en détail. Une présentation doit suivre un fil que l'auditoire peut comprendre en peu de temps. Les mêmes documents doivent donc être réorganisés pour l'oral.",
    sections: [
      {
        heading: "Pourquoi le contenu du rapport ne va pas directement sur les slides",
        paragraphs: [
          "Les paragraphes de rapport sont denses et détaillés. S'ils sont déplacés tels quels sur les diapositives, l'écran devient chargé et la personne qui présente finit par lire.",
          "Les diapositives doivent guider l'auditoire dans le flux principal plutôt que contenir tous les détails.",
        ],
      },
      {
        heading: "Définir la question centrale de la présentation",
        paragraphs: [
          "Avant de créer les slides, décidez ce que l'auditoire doit comprendre après l'écoute. Cette question aide à choisir ce qu'il faut garder ou supprimer.",
          "Certains éléments de contexte nécessaires dans le rapport peuvent être raccourcis à l'oral. Un exemple clair ou un visuel peut devenir plus important.",
        ],
      },
      {
        heading: "Mettre une affirmation et une preuve par diapositive",
        paragraphs: [
          "Une bonne diapositive porte généralement un message principal. Si plusieurs affirmations et preuves sont placées sur la même slide, l'auditoire perd le fil.",
          "Essayez de relier une affirmation à un point de preuve par diapositive, puis expliquez les détails à l'oral.",
        ],
      },
      {
        heading: "Choisir exemples et visuels avec un objectif",
        paragraphs: [
          "Les exemples comptent dans une présentation, mais ils doivent soutenir l'idée principale plutôt que simplement rendre la slide plus intéressante.",
          "Tableaux, images et schémas comparatifs doivent aider la compréhension. S'ils décorent seulement, ils peuvent distraire.",
        ],
      },
      {
        heading: "Structurer le fil de présentation dans Brify",
        paragraphs: [
          "Dans Brify, vous pouvez réorganiser les documents en question de présentation, message de slide, preuve, exemple et conclusion. La structure du rapport et celle de la présentation peuvent rester séparées.",
          "Avant de présenter, la carte aide à trouver les transitions faibles, les slides sans preuve et les parties trop chargées.",
        ],
      },
    ],
    closing:
      "Transformer des documents de devoir en présentation ne consiste pas seulement à raccourcir. Il faut reconstruire le fil. Utilisez Brify pour définir la question centrale et l'ordre des slides.",
  },
  {
    koSlug: "assignment-summary-checklist-before-submit",
    slug: "checklist-resume-devoir-avant-rendu",
    title: "Checklist pour vérifier les résumés de documents avant de rendre un devoir",
    excerpt:
      "Avant de rendre un devoir, vérifiez exactitude du résumé, sources, interprétation, liens affirmation-preuve, plan et citations.",
    seo_keywords: ["checklist avant rendu devoir", "checklist résumé devoir", "vérification rapport avant rendu", "checklist résumé documents", ...commonKeywords],
    intro:
      "Juste avant de rendre un devoir, il est facile de se concentrer seulement sur la grammaire, la mise en page ou le nombre de mots. Mais dans un devoir basé sur des sources, la question la plus importante est de savoir si le résumé est exact, si les sources sont visibles et si vos affirmations sont reliées à des preuves. Une checklist doit vérifier la logique des documents, pas seulement la surface du texte.",
    sections: [
      {
        heading: "Ce qu'on oublie souvent avant de rendre",
        paragraphs: [
          "Beaucoup de personnes polissent les phrases à la fin sans vérifier la structure des documents. Un paragraphe peut être naturel tout en manquant de preuve ou de citation claire.",
          "Si vous avez utilisé des résumés IA ou plusieurs résumés de sources, il faut surtout vérifier l'origine de chaque idée importante.",
        ],
      },
      {
        heading: "Vérifier que le résumé répond à la question",
        paragraphs: [
          "Un résumé peut être clair et pourtant ne pas répondre à la question du devoir. Regardez chaque paragraphe et demandez comment il se relie à la consigne.",
          "Supprimez ou raccourcissez les explications qui ne soutiennent pas la question, et rendez les affirmations et preuves plus visibles.",
        ],
      },
      {
        heading: "Vérifier sources et marques de citation",
        paragraphs: [
          "Les sources prennent beaucoup de temps à retrouver si vous les laissez pour la fin. Avant de rendre, vérifiez que chaque affirmation importante a une source et que citation directe et paraphrase sont séparées.",
          "Si vos documents incluent pages web, articles, textes académiques et supports de cours, le style de citation peut varier selon le type de source.",
        ],
      },
      {
        heading: "Vérifier le lien entre affirmations et preuves",
        paragraphs: [
          "Considérez la première phrase de chaque paragraphe comme l'affirmation, puis vérifiez si la preuve suivante suffit. Si l'affirmation est trop forte, adoucissez-la ou ajoutez un soutien.",
          "À l'inverse, un paragraphe qui résume seulement des sources sans affirmation propre peut manquer de rôle dans le devoir.",
        ],
      },
      {
        heading: "Relire la structure finale dans Brify",
        paragraphs: [
          "Une carte Brify montre en un seul endroit question du devoir, affirmations, preuves, sources et interprétation. Les problèmes de structure sont souvent plus visibles dans une carte que dans un paragraphe fini.",
          "Même une courte relecture finale peut révéler des sources manquantes, des répétitions ou des affirmations qui ont besoin de preuves plus fortes.",
        ],
      },
    ],
    closing:
      "La vérification avant rendu sert à réduire l'inquiétude. Dans Brify, contrôlez que question, affirmation, preuve et source sont reliées, puis rendez le devoir avec plus de confiance.",
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
