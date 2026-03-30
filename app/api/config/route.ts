import { NextResponse } from "next/server";

const TONE_EXAMPLES_GABIN = `Bonjour Madame Bouzidi,
Nous vous remercions pour ce retour et tenons à nous excuser pour votre mauvaise expérience. Afin que nous puissions rectifier le tir correctement, pouvez-vous nous envoyer un email à : bienvenue@gabinrestaurant.com afin de nous expliquer le problème rencontré. Nous ferons en sorte de vous faire apprécier à nouveaux nos pizzas !
Nous vous remercions pour votre temps et vous souhaitons une excellente année 2026.
La Team Gabin

Merci beaucoup de la part de toute la squadra ! A bientôt !

Dear Mr Young,
We are truly sorry to read about your experience, and I want to extend my sincere apologies — not only as the owner of the restaurant, but also on a personal level.
What was meant to be a joyful and meaningful first meal in Europe with your mother clearly became the opposite, and for that, I am genuinely sorry.
Please allow me to clarify a few important points. We take food hygiene and safety extremely seriously, and we strictly follow all HACCP protocols in our kitchen. Our team would be more than happy to welcome you back and offer a full visit of our kitchen, should you wish to see our standards and practices firsthand.
Regarding the handling of the situation: what you describe does not reflect the level of hospitality and professionalism we aim to uphold. We regret that the communication from our team fell short in both empathy and appropriate response — including the lack of a proper apology and the decision to charge you for the dish. This will be addressed internally, and I take full responsibility.
As for your concern about discriminatory treatment: I would like to express clearly that we absolutely do not tolerate racism in any form. Our team is made up of people from over six different nationalities, including several members from Asian backgrounds. We are proud of our diversity, and any form of racial bias is entirely against our values.
I invite you to contact me directly at bonjour@gabinrestaurant.com. I would very much like the opportunity to speak with you personally, offer a resolution, and hopefully regain your trust.
With respect and sincerity,
Sydney Abbou
Owner Gabin Restaurant

Bonjour,
Nous vous remercions pour votre retour. Effectivement cela fait bientôt deux ans que nous n'avons plus de salade au thon à notre carte. Dans un souci de maintien de qualité, nous avons préféré la retirer des choix. Nous notons vos retours et les ferons remonter à toutes les équipes afin de continuer à améliorer l'expérience Gabin.
Nous nous excusons pour les désagréments que ne se reproduiront pas et vous assurons que vous apprécierez votre prochaine visite comme il se doit.
Toutes nos excuses encore.
La Team Gabin`;

const TONE_EXAMPLES_COTE_SUSHI = `Bonjour Madame,
Nous sommes sincèrement désolés pour cette mauvaise expérience qui nous touche particulièrement. Nous vous serions reconnaissant de nous envoyer un email à asnieres@cotesushi.com afin de nous donner plus de détails sur le jour de votre venue et la situation. Nous ferons en sorte de rectifier de tir.

Nous vous remercions.

Bien cordialement,

Bonjour Monsieur Badreedine,
Nous sommes heureux de savoir que vous avez oublié votre reçu et que, par consequent, nous avons la note d'une étoile ! Que dire de plus ? Merci de la part de toute la team Cote Sushi qui met tout son coeur à l'ouvrage, tous les jours depuis maintenant 4 ans !

Bonjour Mme Bechar

Nous sommes sincèrement désolés pour cette expérience frustrante et sommes désolé que ca ne se soit pas passé comme prévu.

En effet, lorsque les informations de contact ne sont pas à jour, cela complique considérablement le travail de nos livreurs, mais malheureusement nous n'y sommes pour rien. Comme pour n'importe qui, même AMAZON, si vous ne fournissez pas les bonnes informations comme le numero de telephone, c'est impossible de vous joindre et donc de vous remettre votre commande. Cela étant dit, nous comprenons parfaitement votre déception et regrettons que vous n'ayez pas reçu le suivi promis.

Nous prenons votre retour très au sérieux et allons faire un point en interne sur le suivi de votre demande.
Bien cordialement,
L'équipe CS`;

export async function GET() {
  return NextResponse.json({
    toneExamplesGabin: TONE_EXAMPLES_GABIN,
    toneExamplesCoteSushi: TONE_EXAMPLES_COTE_SUSHI,
  });
}
