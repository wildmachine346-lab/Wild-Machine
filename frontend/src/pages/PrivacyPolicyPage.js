import { useI18n } from '../context/I18nContext';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';
import { Shield, FileText, Users, AlertTriangle, Scale, Building, UserCheck, Database, Ban, Gavel, CreditCard, Mail, Lock } from 'lucide-react';

const content = {
  en: {
    legalIdentity: {
      title: "Legal Identity",
      sections: [
        { subtitle: "Site Operator", text: "Wild Machine is operated by Wild Machine Inc. (or its legal representative). Status: Corporation registered in the Province of Quebec, Canada." },
        { subtitle: "Registered Address", text: "Montréal, QC, Canada. Full registered address available upon written request." },
        { subtitle: "Official Contact", text: "Email: legal@wildmachine.com — For any legal inquiry, complaint, or official correspondence, please use this address exclusively." }
      ]
    },
    dataOfficer: {
      title: "Data Protection Officer (Loi 25)",
      sections: [
        { subtitle: "Designated Officer", text: "In compliance with Quebec's Act respecting the protection of personal information in the private sector (Loi 25), a designated person is responsible for the protection of personal information collected and processed by Wild Machine." },
        { subtitle: "Contact", text: "Data Protection Officer — Email: privacy@wildmachine.com. All requests related to personal data (access, rectification, deletion, portability) must be sent to this address." },
        { subtitle: "Request Procedure", text: "Submit your request in writing by email, specifying your full name, the email address associated with your account, and the nature of your request. You may request: (1) access to your personal data, (2) rectification of inaccurate data, (3) deletion of your data, (4) withdrawal of consent, (5) data portability." },
        { subtitle: "Processing Timeframe", text: "We will acknowledge receipt within 5 business days and provide a complete response within 30 calendar days, as required by law. If additional time is needed, you will be notified with an explanation." }
      ]
    },
    privacy: {
      title: "Privacy Policy — Personal Data",
      sections: [
        { subtitle: "Data Collected", text: "We collect the following personal data: email address, display name, password (stored as a bcrypt hash, never in plain text), city, profile photos and videos (watermarked upon upload), geolocation data (latitude/longitude, only if voluntarily provided), phone number (optional, for listings), IP address and technical logs (access logs, timestamps, user agent), payment transaction metadata (via BTCPay Server — we never store cryptocurrency wallet details)." },
        { subtitle: "Purpose of Collection", text: "Your data is collected and processed for the following purposes: (1) account creation and authentication, (2) publication and display of classified listings, (3) search and geolocation features, (4) payment processing for premium services, (5) platform security, fraud prevention, and moderation, (6) communication of service updates and legal notices, (7) compliance with legal obligations." },
        { subtitle: "Retention Period", text: "Active account data is retained as long as the account is active. Upon account deletion, personal data is permanently deleted within 30 days, except where retention is required by law (e.g., payment records retained for 7 years for tax purposes). Technical logs are retained for a maximum of 12 months." },
        { subtitle: "Data Security", text: "We implement industry-standard security measures: passwords are hashed with bcrypt, all communications are encrypted via HTTPS/TLS, API access is secured with JWT tokens, rate limiting protects against abuse, and access to data is restricted to authorized personnel only." },
        { subtitle: "Cookies", text: "We use strictly necessary cookies for authentication and session management (JWT tokens stored locally). No third-party advertising or tracking cookies are used. No data is shared with advertising networks." },
        { subtitle: "Third-Party Sharing", text: "We do not sell, rent, or share your personal data with third parties for marketing purposes. Data is shared only with: BTCPay Server (cryptocurrency payment processing), Resend (transactional emails), and Cloudflare (security/CAPTCHA). Each provider is bound by their own privacy policy and data protection obligations." },
        { subtitle: "Right of Withdrawal and Deletion", text: "You may withdraw your consent and request complete deletion of your account and personal data at any time by contacting privacy@wildmachine.com. Upon deletion: your profile, listings, media, and personal information are permanently removed. Anonymized data may be retained for statistical purposes only." }
      ]
    },
    userResponsibility: {
      title: "User Responsibility",
      sections: [
        { subtitle: "Content Ownership", text: "Each user is entirely and solely responsible for the content they publish on Wild Machine, including text, photos, videos, and any other material. Wild Machine acts solely as a hosting platform and does not produce, verify, or endorse user-generated content." },
        { subtitle: "Age Certification", text: "By creating an account, you solemnly declare and certify that you are at least 18 years of age. Any false declaration constitutes a violation of these terms and may be reported to the appropriate authorities." },
        { subtitle: "Consent Guarantee", text: "You guarantee that all persons depicted in your photos and videos have given their explicit, informed, and revocable consent for their image to be published on this platform. You are solely liable for any claim arising from unauthorized use of someone's image." },
        { subtitle: "Image Rights", text: "You guarantee that you own or have obtained all necessary rights, licenses, and permissions for every image and video you upload. You assume full legal responsibility for any copyright infringement." },
        { subtitle: "Legal Compliance", text: "You agree to comply with all applicable laws, including Canadian federal law, Quebec provincial law, and any laws applicable in your jurisdiction. You are solely responsible for ensuring your content and activities are lawful." }
      ]
    },
    moderation: {
      title: "Moderation Rights",
      sections: [
        { subtitle: "Content Removal", text: "Wild Machine reserves the absolute right to remove, modify, or hide any content at any time, without prior notice, for any reason including but not limited to: violation of these terms, reports from other users, legal requests, or content deemed inappropriate at our sole discretion." },
        { subtitle: "Account Suspension", text: "Wild Machine reserves the right to suspend or permanently ban any user account, without prior notice, in cases of: terms violation, suspicious activity, fraudulent behavior, repeated complaints, or legal requirement. No refund is owed for premium services in case of ban for terms violation." },
        { subtitle: "Listing Modification", text: "We may edit, unpublish, or remove any listing that does not comply with our guidelines, contains inaccurate information, or has been reported. The decision to take action is final and at our sole discretion." }
      ]
    },
    platformClause: {
      title: "Platform Nature & Limitation of Liability",
      sections: [
        { subtitle: "Intermediary Platform", text: "Wild Machine is strictly and exclusively a classified ads platform facilitating connections between users. Wild Machine is not a party to any transaction, agreement, or interaction between users. We do not provide, endorse, or guarantee any service advertised on the platform." },
        { subtitle: "No Transaction Involvement", text: "Wild Machine has no involvement whatsoever in transactions, meetings, exchanges, or agreements between users. Any arrangement made between users is their sole responsibility." },
        { subtitle: "No Service Guarantee", text: "Wild Machine makes no representation or warranty regarding the accuracy, reliability, or quality of listings, user profiles, or advertised services. Users interact at their own risk." },
        { subtitle: "Off-Platform Interactions", text: "Wild Machine bears no responsibility for any interaction, incident, dispute, or harm that occurs outside of the platform, whether online or in person." }
      ]
    },
    prohibitedContent: {
      title: "Prohibited Content",
      sections: [
        { subtitle: "Absolute Prohibitions", text: "The following content is strictly and absolutely prohibited. Any violation results in immediate and permanent account termination without notice, and may be reported to law enforcement:" },
        { subtitle: "Minors", text: "Any content depicting, suggesting, or involving persons under the age of 18 is absolutely prohibited. This includes photos, descriptions, or any reference. Zero tolerance policy." },
        { subtitle: "Non-Consensual Content", text: "Any content published without the explicit consent of the depicted person, including revenge content, hidden recordings, or stolen images." },
        { subtitle: "Human Trafficking", text: "Any content related to, facilitating, or suggesting human trafficking, forced labor, exploitation, or coercion of any kind." },
        { subtitle: "Violence & Drugs", text: "Any content depicting, promoting, or glorifying violence, weapons, illegal drug use, or substance abuse." },
        { subtitle: "Fake Profiles", text: "Creating accounts with false identities, using stolen photos, impersonating another person, or operating multiple fraudulent accounts." },
        { subtitle: "Illegal Activities", text: "Any content that promotes, facilitates, or relates to any activity illegal under Canadian federal or Quebec provincial law." }
      ]
    },
    copyright: {
      title: "Copyright & Image Rights",
      sections: [
        { subtitle: "Ownership Guarantee", text: "By uploading content to Wild Machine, you represent and warrant that you are the rightful owner or have obtained all necessary authorizations for the content you publish. You assume full legal liability for any copyright infringement claim." },
        { subtitle: "Platform License", text: "By uploading content, you grant Wild Machine a non-exclusive, worldwide, royalty-free license to display, reproduce, and distribute your content solely for the purpose of operating the platform (displaying listings, search results, thumbnails). This license terminates when you delete your content or account." },
        { subtitle: "Watermark", text: "All uploaded images are automatically watermarked with the Wild Machine name for protection against unauthorized use. Only the watermarked version is stored." },
        { subtitle: "DMCA / Takedown", text: "If you believe your copyrighted work has been used without authorization, contact legal@wildmachine.com with: (1) identification of the copyrighted work, (2) the URL of the infringing content, (3) your contact information, (4) a statement of good faith." }
      ]
    },
    payments: {
      title: "Payments & Billing",
      sections: [
        { subtitle: "Payment Processor", text: "All payments are processed via BTCPay Server, a self-hosted, open-source cryptocurrency payment processor. Wild Machine never stores or has access to your cryptocurrency wallet details. BTCPay Server acts as a technical intermediary for Bitcoin payments." },
        { subtitle: "Non-Refundable", text: "Premium listing fees are non-refundable once the listing has been activated. By completing a purchase, you acknowledge and accept this policy." },
        { subtitle: "User Transactions", text: "Wild Machine is not involved in and bears no responsibility for any financial transaction, payment, or exchange between users outside of the platform's premium listing system." }
      ]
    },
    legalContact: {
      title: "Legal Contact",
      sections: [
        { subtitle: "General Inquiries", text: "Email: support@wildmachine.com" },
        { subtitle: "Legal & Compliance", text: "Email: legal@wildmachine.com — For legal notices, court orders, takedown requests, and official correspondence." },
        { subtitle: "Data Protection", text: "Email: privacy@wildmachine.com — For all requests related to personal data under Loi 25 and applicable privacy legislation." }
      ]
    },
    ageNotice: {
      title: "Age Verification (18+)",
      text: "This website contains adult content and is intended exclusively for individuals who are 18 years of age or older. By accessing this website, creating an account, or browsing listings, you explicitly and solemnly declare that: (1) you are at least 18 years old, (2) you are of legal age in your jurisdiction, (3) accessing adult content is legal in your jurisdiction. If you are not of legal age, you must leave this website immediately. Any false declaration of age constitutes a violation of these terms and applicable law."
    },
    terms: {
      title: "Terms of Service",
      sections: [
        { subtitle: "Acceptance", text: "By accessing, browsing, or using Wild Machine in any way, you agree to be bound by these Terms of Service, Privacy Policy, and Content Guidelines. If you do not agree with any part of these terms, you must not use the platform." },
        { subtitle: "Modifications", text: "Wild Machine reserves the right to modify these terms at any time. Changes take effect upon publication. Continued use of the platform after modifications constitutes acceptance of the updated terms." },
        { subtitle: "Applicable Law", text: "These terms are governed by the laws of the Province of Quebec and the federal laws of Canada applicable therein. Any dispute shall be subject to the exclusive jurisdiction of the courts of the judicial district of Montréal, Quebec." },
        { subtitle: "Severability", text: "If any provision of these terms is held invalid or unenforceable, the remaining provisions shall continue in full force and effect." }
      ]
    }
  },
  fr: {
    legalIdentity: {
      title: "Identité légale",
      sections: [
        { subtitle: "Exploitant du site", text: "Wild Machine est exploité par Wild Machine Inc. (ou son représentant légal). Statut : Société enregistrée dans la province de Québec, Canada." },
        { subtitle: "Adresse enregistrée", text: "Montréal, QC, Canada. L'adresse complète est disponible sur demande écrite." },
        { subtitle: "Contact officiel", text: "Courriel : legal@wildmachine.com — Pour toute demande légale, plainte ou correspondance officielle, veuillez utiliser exclusivement cette adresse." }
      ]
    },
    dataOfficer: {
      title: "Responsable des données (Loi 25)",
      sections: [
        { subtitle: "Personne désignée", text: "Conformément à la Loi sur la protection des renseignements personnels dans le secteur privé du Québec (Loi 25), une personne désignée est responsable de la protection des renseignements personnels collectés et traités par Wild Machine." },
        { subtitle: "Contact", text: "Responsable de la protection des données — Courriel : privacy@wildmachine.com. Toute demande relative aux données personnelles (accès, rectification, suppression, portabilité) doit être envoyée à cette adresse." },
        { subtitle: "Procédure de demande", text: "Soumettez votre demande par écrit par courriel en précisant votre nom complet, l'adresse courriel associée à votre compte et la nature de votre demande. Vous pouvez demander : (1) l'accès à vos données personnelles, (2) la rectification de données inexactes, (3) la suppression de vos données, (4) le retrait de votre consentement, (5) la portabilité de vos données." },
        { subtitle: "Délai de traitement", text: "Nous accuserons réception dans un délai de 5 jours ouvrables et fournirons une réponse complète dans un délai de 30 jours civils, conformément à la loi. Si un délai supplémentaire est nécessaire, vous en serez informé avec une explication." }
      ]
    },
    privacy: {
      title: "Politique de confidentialité — Données personnelles",
      sections: [
        { subtitle: "Données collectées", text: "Nous collectons les données personnelles suivantes : adresse courriel, nom d'affichage, mot de passe (stocké sous forme de hachage bcrypt, jamais en clair), ville, photos et vidéos de profil (filigranées automatiquement), données de géolocalisation (latitude/longitude, uniquement si volontairement fournies), numéro de téléphone (optionnel, pour les annonces), adresse IP et journaux techniques (journaux d'accès, horodatages, agent utilisateur), métadonnées de transactions de paiement (via BTCPay Server — nous ne stockons jamais les détails de portefeuille crypto)." },
        { subtitle: "Finalités de la collecte", text: "Vos données sont collectées et traitées aux fins suivantes : (1) création de compte et authentification, (2) publication et affichage d'annonces classées, (3) fonctionnalités de recherche et géolocalisation, (4) traitement des paiements pour services premium, (5) sécurité de la plateforme, prévention de la fraude et modération, (6) communication des mises à jour du service et avis légaux, (7) conformité aux obligations légales." },
        { subtitle: "Durée de conservation", text: "Les données de compte actif sont conservées tant que le compte est actif. Lors de la suppression du compte, les données personnelles sont définitivement supprimées dans un délai de 30 jours, sauf si la conservation est requise par la loi (ex. : registres de paiement conservés 7 ans à des fins fiscales). Les journaux techniques sont conservés pour un maximum de 12 mois." },
        { subtitle: "Sécurité des données", text: "Nous mettons en œuvre des mesures de sécurité conformes aux normes de l'industrie : les mots de passe sont hachés avec bcrypt, toutes les communications sont chiffrées via HTTPS/TLS, l'accès à l'API est sécurisé par des jetons JWT, la limitation de débit protège contre les abus, et l'accès aux données est restreint au personnel autorisé uniquement." },
        { subtitle: "Cookies", text: "Nous utilisons uniquement des cookies strictement nécessaires à l'authentification et à la gestion des sessions (jetons JWT stockés localement). Aucun cookie publicitaire ou de suivi tiers n'est utilisé. Aucune donnée n'est partagée avec des réseaux publicitaires." },
        { subtitle: "Partage avec des tiers", text: "Nous ne vendons, ne louons et ne partageons pas vos données personnelles avec des tiers à des fins de marketing. Les données sont partagées uniquement avec : BTCPay Server (traitement des paiements en cryptomonnaie), Resend (courriels transactionnels) et Cloudflare (sécurité/CAPTCHA). Chaque fournisseur est lié par sa propre politique de confidentialité." },
        { subtitle: "Droit de retrait et suppression", text: "Vous pouvez retirer votre consentement et demander la suppression complète de votre compte et de vos données personnelles à tout moment en contactant privacy@wildmachine.com. Lors de la suppression : votre profil, vos annonces, vos médias et vos informations personnelles sont définitivement supprimés. Les données anonymisées peuvent être conservées uniquement à des fins statistiques." }
      ]
    },
    userResponsibility: {
      title: "Responsabilité de l'utilisateur",
      sections: [
        { subtitle: "Propriété du contenu", text: "Chaque utilisateur est entièrement et exclusivement responsable du contenu qu'il publie sur Wild Machine, y compris les textes, photos, vidéos et tout autre matériel. Wild Machine agit uniquement en tant que plateforme d'hébergement et ne produit, ne vérifie ni n'approuve le contenu généré par les utilisateurs." },
        { subtitle: "Certification d'âge", text: "En créant un compte, vous déclarez solennellement et certifiez avoir au moins 18 ans. Toute fausse déclaration constitue une violation de ces conditions et peut être signalée aux autorités compétentes." },
        { subtitle: "Garantie de consentement", text: "Vous garantissez que toutes les personnes représentées dans vos photos et vidéos ont donné leur consentement explicite, éclairé et révocable pour que leur image soit publiée sur cette plateforme. Vous êtes seul responsable de toute réclamation découlant de l'utilisation non autorisée de l'image d'une personne." },
        { subtitle: "Droits sur les images", text: "Vous garantissez être le propriétaire ou avoir obtenu toutes les autorisations nécessaires pour chaque image et vidéo que vous téléversez. Vous assumez l'entière responsabilité légale pour toute violation de droits d'auteur." },
        { subtitle: "Conformité légale", text: "Vous vous engagez à respecter toutes les lois applicables, y compris les lois fédérales canadiennes, les lois provinciales du Québec et toute loi applicable dans votre juridiction. Vous êtes seul responsable de vous assurer que votre contenu et vos activités sont licites." }
      ]
    },
    moderation: {
      title: "Droit de modération",
      sections: [
        { subtitle: "Suppression de contenu", text: "Wild Machine se réserve le droit absolu de supprimer, modifier ou masquer tout contenu à tout moment, sans préavis, pour quelque raison que ce soit, y compris mais sans s'y limiter : violation de ces conditions, signalements d'autres utilisateurs, demandes légales, ou contenu jugé inapproprié à notre seule discrétion." },
        { subtitle: "Suspension de compte", text: "Wild Machine se réserve le droit de suspendre ou de bannir définitivement tout compte utilisateur, sans préavis, en cas de : violation des conditions, activité suspecte, comportement frauduleux, plaintes répétées ou exigence légale. Aucun remboursement n'est dû pour les services premium en cas de bannissement pour violation des conditions." },
        { subtitle: "Modification d'annonces", text: "Nous pouvons modifier, dépublier ou supprimer toute annonce non conforme à nos directives, contenant des informations inexactes ou ayant fait l'objet d'un signalement. La décision de prendre des mesures est finale et à notre seule discrétion." }
      ]
    },
    platformClause: {
      title: "Nature de la plateforme et limitation de responsabilité",
      sections: [
        { subtitle: "Plateforme intermédiaire", text: "Wild Machine est strictement et exclusivement une plateforme d'annonces classées facilitant la mise en relation entre utilisateurs. Wild Machine n'est partie à aucune transaction, entente ou interaction entre utilisateurs. Nous ne fournissons, n'approuvons ni ne garantissons aucun service annoncé sur la plateforme." },
        { subtitle: "Aucune implication dans les transactions", text: "Wild Machine n'a aucune implication dans les transactions, rencontres, échanges ou ententes entre utilisateurs. Tout arrangement conclu entre utilisateurs relève de leur seule responsabilité." },
        { subtitle: "Aucune garantie de service", text: "Wild Machine ne fait aucune déclaration ni garantie concernant l'exactitude, la fiabilité ou la qualité des annonces, profils utilisateurs ou services annoncés. Les utilisateurs interagissent à leurs propres risques." },
        { subtitle: "Interactions hors plateforme", text: "Wild Machine n'assume aucune responsabilité pour toute interaction, incident, litige ou préjudice survenant en dehors de la plateforme, que ce soit en ligne ou en personne." }
      ]
    },
    prohibitedContent: {
      title: "Contenu interdit",
      sections: [
        { subtitle: "Interdictions absolues", text: "Le contenu suivant est strictement et absolument interdit. Toute violation entraîne la suppression immédiate et permanente du compte sans préavis, et peut être signalée aux forces de l'ordre :" },
        { subtitle: "Mineurs", text: "Tout contenu représentant, suggérant ou impliquant des personnes de moins de 18 ans est absolument interdit. Cela inclut les photos, descriptions ou toute référence. Politique de tolérance zéro." },
        { subtitle: "Contenu non consenti", text: "Tout contenu publié sans le consentement explicite de la personne représentée, y compris le contenu de vengeance, les enregistrements cachés ou les images volées." },
        { subtitle: "Traite de personnes", text: "Tout contenu lié, facilitant ou suggérant la traite de personnes, le travail forcé, l'exploitation ou la coercition de quelque nature que ce soit." },
        { subtitle: "Violence et drogues", text: "Tout contenu représentant, promouvant ou glorifiant la violence, les armes, l'usage de drogues illicites ou l'abus de substances." },
        { subtitle: "Faux profils", text: "Créer des comptes avec de fausses identités, utiliser des photos volées, se faire passer pour une autre personne ou exploiter plusieurs comptes frauduleux." },
        { subtitle: "Activités illégales", text: "Tout contenu promouvant, facilitant ou se rapportant à toute activité illégale en vertu du droit fédéral canadien ou du droit provincial québécois." }
      ]
    },
    copyright: {
      title: "Droits d'auteur et droits sur les images",
      sections: [
        { subtitle: "Garantie de propriété", text: "En téléversant du contenu sur Wild Machine, vous déclarez et garantissez être le propriétaire légitime ou avoir obtenu toutes les autorisations nécessaires pour le contenu que vous publiez. Vous assumez l'entière responsabilité légale pour toute réclamation de violation de droits d'auteur." },
        { subtitle: "Licence de plateforme", text: "En téléversant du contenu, vous accordez à Wild Machine une licence non exclusive, mondiale et libre de redevances pour afficher, reproduire et distribuer votre contenu uniquement aux fins d'exploitation de la plateforme (affichage des annonces, résultats de recherche, vignettes). Cette licence prend fin lorsque vous supprimez votre contenu ou votre compte." },
        { subtitle: "Filigrane", text: "Toutes les images téléversées sont automatiquement filigranées avec le nom Wild Machine pour protéger contre l'utilisation non autorisée. Seule la version filigranée est conservée." },
        { subtitle: "Retrait de contenu (DMCA)", text: "Si vous estimez que votre œuvre protégée par le droit d'auteur a été utilisée sans autorisation, contactez legal@wildmachine.com avec : (1) l'identification de l'œuvre protégée, (2) l'URL du contenu en cause, (3) vos coordonnées, (4) une déclaration de bonne foi." }
      ]
    },
    payments: {
      title: "Paiements et facturation",
      sections: [
        { subtitle: "Processeur de paiement", text: "Tous les paiements sont traités via BTCPay Server, un processeur de paiement en cryptomonnaie open-source auto-hébergé. Wild Machine ne stocke jamais et n'a jamais accès aux détails de votre portefeuille crypto. BTCPay Server agit en tant qu'intermédiaire technique pour les paiements en Bitcoin." },
        { subtitle: "Non remboursable", text: "Les frais d'annonces premium ne sont pas remboursables une fois l'annonce activée. En effectuant un achat, vous reconnaissez et acceptez cette politique." },
        { subtitle: "Transactions entre utilisateurs", text: "Wild Machine n'est aucunement impliqué et n'assume aucune responsabilité pour toute transaction financière, paiement ou échange entre utilisateurs en dehors du système de mise en vedette premium de la plateforme." }
      ]
    },
    legalContact: {
      title: "Contact légal",
      sections: [
        { subtitle: "Demandes générales", text: "Courriel : support@wildmachine.com" },
        { subtitle: "Légal et conformité", text: "Courriel : legal@wildmachine.com — Pour les avis légaux, ordonnances judiciaires, demandes de retrait et correspondance officielle." },
        { subtitle: "Protection des données", text: "Courriel : privacy@wildmachine.com — Pour toute demande relative aux données personnelles en vertu de la Loi 25 et de la législation applicable en matière de vie privée." }
      ]
    },
    ageNotice: {
      title: "Vérification d'âge (18+)",
      text: "Ce site contient du contenu pour adultes destiné exclusivement aux personnes âgées de 18 ans ou plus. En accédant à ce site, en créant un compte ou en parcourant les annonces, vous déclarez explicitement et solennellement que : (1) vous avez au moins 18 ans, (2) vous avez l'âge légal dans votre juridiction, (3) l'accès au contenu pour adultes est légal dans votre juridiction. Si vous n'avez pas l'âge légal, vous devez quitter ce site immédiatement. Toute fausse déclaration d'âge constitue une violation de ces conditions et de la loi applicable."
    },
    terms: {
      title: "Conditions d'utilisation",
      sections: [
        { subtitle: "Acceptation", text: "En accédant, naviguant ou utilisant Wild Machine de quelque manière que ce soit, vous acceptez d'être lié par ces Conditions d'utilisation, la Politique de confidentialité et les Règles de contenu. Si vous n'êtes pas d'accord avec une partie de ces conditions, vous ne devez pas utiliser la plateforme." },
        { subtitle: "Modifications", text: "Wild Machine se réserve le droit de modifier ces conditions à tout moment. Les modifications prennent effet dès leur publication. L'utilisation continue de la plateforme après les modifications constitue l'acceptation des conditions mises à jour." },
        { subtitle: "Droit applicable", text: "Ces conditions sont régies par les lois de la province de Québec et les lois fédérales du Canada qui y sont applicables. Tout litige sera soumis à la compétence exclusive des tribunaux du district judiciaire de Montréal, Québec." },
        { subtitle: "Divisibilité", text: "Si une disposition de ces conditions est jugée invalide ou inapplicable, les dispositions restantes continueront de s'appliquer pleinement." }
      ]
    }
  },
  zh: {
    legalIdentity: {
      title: "\u6cd5\u5f8b\u8eab\u4efd",
      sections: [
        { subtitle: "\u7f51\u7ad9\u8fd0\u8425\u8005", text: "Wild Machine \u7531 Wild Machine Inc. \u8fd0\u8425\u3002\u6ce8\u518c\u5730\uff1a\u52a0\u62ff\u5927\u9b41\u5317\u514b\u7701\u3002" },
        { subtitle: "\u5b98\u65b9\u8054\u7cfb", text: "\u90ae\u7bb1\uff1alegal@wildmachine.com" }
      ]
    },
    dataOfficer: {
      title: "\u6570\u636e\u4fdd\u62a4\u8d1f\u8d23\u4eba",
      sections: [
        { subtitle: "\u8054\u7cfb\u65b9\u5f0f", text: "\u6570\u636e\u4fdd\u62a4\u5b98 \u2014 \u90ae\u7bb1\uff1aprivacy@wildmachine.com\u3002\u6240\u6709\u4e0e\u4e2a\u4eba\u6570\u636e\u76f8\u5173\u7684\u8bf7\u6c42\u8bf7\u53d1\u9001\u81f3\u6b64\u5730\u5740\u3002" },
        { subtitle: "\u5904\u7406\u65f6\u95f4", text: "\u6211\u4eec\u5c06\u57285\u4e2a\u5de5\u4f5c\u65e5\u5185\u786e\u8ba4\u6536\u5230\uff0c\u5e76\u572830\u4e2a\u65e5\u5386\u65e5\u5185\u63d0\u4f9b\u5b8c\u6574\u7b54\u590d\u3002" }
      ]
    },
    privacy: {
      title: "\u9690\u79c1\u653f\u7b56",
      sections: [
        { subtitle: "\u6536\u96c6\u7684\u6570\u636e", text: "\u6211\u4eec\u6536\u96c6\uff1a\u7535\u5b50\u90ae\u4ef6\u3001\u663e\u793a\u540d\u79f0\u3001\u5bc6\u7801\uff08bcrypt\u54c8\u5e0c\uff09\u3001\u57ce\u5e02\u3001\u7167\u7247\u548c\u89c6\u9891\u3001\u5730\u7406\u4f4d\u7f6e\u3001IP\u5730\u5740\u548c\u6280\u672f\u65e5\u5fd7\u3001\u652f\u4ed8\u5143\u6570\u636e\u3002" },
        { subtitle: "\u6570\u636e\u5b89\u5168", text: "\u5bc6\u7801\u4f7f\u7528bcrypt\u52a0\u5bc6\uff0c\u6240\u6709\u901a\u4fe1\u901a\u8fc7HTTPS/TLS\u52a0\u5bc6\uff0cAPI\u4f7f\u7528JWT\u4ee4\u724c\u4fdd\u62a4\u3002" },
        { subtitle: "\u60a8\u7684\u6743\u5229", text: "\u60a8\u53ef\u4ee5\u968f\u65f6\u8054\u7cfb privacy@wildmachine.com \u8bf7\u6c42\u8bbf\u95ee\u3001\u4fee\u6539\u6216\u5220\u9664\u60a8\u7684\u4e2a\u4eba\u6570\u636e\u3002" }
      ]
    },
    userResponsibility: {
      title: "\u7528\u6237\u8d23\u4efb",
      sections: [
        { subtitle: "\u5185\u5bb9\u8d23\u4efb", text: "\u6bcf\u4e2a\u7528\u6237\u5bf9\u5176\u53d1\u5e03\u7684\u5185\u5bb9\u627f\u62c5\u5168\u90e8\u8d23\u4efb\u3002\u60a8\u5fc5\u987b\u5e74\u6ee118\u5c81\uff0c\u5e76\u4fdd\u8bc1\u6240\u6709\u56fe\u7247\u5747\u5f81\u5f97\u540c\u610f\u3002" },
        { subtitle: "\u56fe\u7247\u6743\u5229", text: "\u60a8\u4fdd\u8bc1\u62e5\u6709\u6240\u6709\u4e0a\u4f20\u5185\u5bb9\u7684\u6743\u5229\u3002" }
      ]
    },
    moderation: {
      title: "\u5ba1\u6838\u6743\u5229",
      sections: [
        { subtitle: "\u5185\u5bb9\u5220\u9664", text: "Wild Machine \u4fdd\u7559\u968f\u65f6\u5220\u9664\u4efb\u4f55\u5185\u5bb9\u7684\u6743\u5229\u3002" },
        { subtitle: "\u8d26\u6237\u5c01\u7981", text: "Wild Machine \u4fdd\u7559\u6682\u505c\u6216\u6c38\u4e45\u5c01\u7981\u4efb\u4f55\u8d26\u6237\u7684\u6743\u5229\u3002" }
      ]
    },
    platformClause: {
      title: "\u5e73\u53f0\u6027\u8d28",
      sections: [
        { subtitle: "\u4e2d\u4ecb\u5e73\u53f0", text: "Wild Machine \u4ec5\u4e3a\u7528\u6237\u4e4b\u95f4\u7684\u8fde\u63a5\u5e73\u53f0\u3002\u6211\u4eec\u4e0d\u53c2\u4e0e\u7528\u6237\u4e4b\u95f4\u7684\u4efb\u4f55\u4ea4\u6613\u3002" }
      ]
    },
    prohibitedContent: {
      title: "\u7981\u6b62\u5185\u5bb9",
      sections: [
        { subtitle: "\u672a\u6210\u5e74\u4eba", text: "\u4e25\u7981\u4efb\u4f55\u6d89\u53ca\u672a\u6210\u5e74\u4eba\u7684\u5185\u5bb9\u3002\u96f6\u5bb9\u5fcd\u653f\u7b56\u3002" },
        { subtitle: "\u975e\u6cd5\u6d3b\u52a8", text: "\u4e25\u7981\u4efb\u4f55\u8fdd\u6cd5\u5185\u5bb9\uff0c\u5305\u62ec\u8d29\u5356\u4eba\u53e3\u3001\u66b4\u529b\u3001\u6bd2\u54c1\u548c\u865a\u5047\u8d44\u6599\u3002" }
      ]
    },
    copyright: {
      title: "\u7248\u6743",
      sections: [
        { subtitle: "\u6240\u6709\u6743", text: "\u60a8\u4fdd\u8bc1\u62e5\u6709\u6240\u6709\u4e0a\u4f20\u5185\u5bb9\u7684\u6743\u5229\u3002\u6240\u6709\u56fe\u7247\u81ea\u52a8\u6dfb\u52a0 Wild Machine \u6c34\u5370\u3002" }
      ]
    },
    payments: {
      title: "\u652f\u4ed8",
      sections: [
        { subtitle: "\u652f\u4ed8\u5904\u7406", text: "\u6240\u6709\u652f\u4ed8\u901a\u8fc7BTCPay Server\u5904\u7406\u3002\u9ad8\u7ea7\u8d39\u7528\u4e0d\u53ef\u9000\u6b3e\u3002" }
      ]
    },
    legalContact: {
      title: "\u6cd5\u5f8b\u8054\u7cfb",
      sections: [
        { subtitle: "\u8054\u7cfb\u65b9\u5f0f", text: "support@wildmachine.com | legal@wildmachine.com | privacy@wildmachine.com" }
      ]
    },
    ageNotice: {
      title: "18+\u58f0\u660e",
      text: "\u672c\u7f51\u7ad9\u4ec5\u9650\u5e74\u6ee118\u5c81\u6216\u4ee5\u4e0a\u4eba\u58eb\u8bbf\u95ee\u3002\u8bbf\u95ee\u5373\u8868\u793a\u60a8\u786e\u8ba4\u5df2\u8fbe\u5230\u6cd5\u5b9a\u5e74\u9f84\u3002"
    },
    terms: {
      title: "\u670d\u52a1\u6761\u6b3e",
      sections: [
        { subtitle: "\u63a5\u53d7", text: "\u4f7f\u7528 Wild Machine \u5373\u8868\u793a\u60a8\u540c\u610f\u8fd9\u4e9b\u6761\u6b3e\u3002" },
        { subtitle: "\u9002\u7528\u6cd5\u5f8b", text: "\u8fd9\u4e9b\u6761\u6b3e\u53d7\u52a0\u62ff\u5927\u9b41\u5317\u514b\u7701\u6cd5\u5f8b\u7ba1\u8f96\u3002" }
      ]
    }
  }
};

export default function PrivacyPolicyPage() {
  const { t, language } = useI18n();
  const c = content[language] || content.en;

  const SectionBlock = ({ icon, data }) => (
    <section className="mb-12" data-testid={`legal-section-${data.title?.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
      <div className="flex items-center gap-3 mb-6">
        {icon}
        <h2 className="text-xl md:text-2xl text-white font-heading">{data.title}</h2>
      </div>
      {data.sections ? (
        <div className="space-y-5">
          {data.sections.map((s, i) => (
            <div key={i} className="border-l-2 border-gold/30 pl-4">
              {s.subtitle && <h3 className="text-gold font-semibold mb-1 text-sm">{s.subtitle}</h3>}
              <p className="text-[#a3a3a3] leading-relaxed text-sm">{s.text}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-[#a3a3a3] leading-relaxed text-sm border-l-2 border-gold/30 pl-4">{data.text}</p>
      )}
    </section>
  );

  return (
    <div className="min-h-screen bg-obsidian" data-testid="privacy-policy-page">
      <Header />
      <main className="max-w-3xl mx-auto px-4 py-12">
        <h1 className="text-4xl sm:text-5xl text-white font-heading mb-2" data-testid="legal-page-title">{t('legal')}</h1>
        <p className="text-[#666] mb-12">Last updated: March 2026</p>

        <SectionBlock icon={<Building className="text-gold flex-shrink-0" size={24} />} data={c.legalIdentity} />
        <SectionBlock icon={<UserCheck className="text-gold flex-shrink-0" size={24} />} data={c.dataOfficer} />
        <SectionBlock icon={<Database className="text-gold flex-shrink-0" size={24} />} data={c.privacy} />
        <SectionBlock icon={<Users className="text-gold flex-shrink-0" size={24} />} data={c.userResponsibility} />
        <SectionBlock icon={<Gavel className="text-gold flex-shrink-0" size={24} />} data={c.moderation} />
        <SectionBlock icon={<Scale className="text-gold flex-shrink-0" size={24} />} data={c.platformClause} />
        <SectionBlock icon={<Ban className="text-gold flex-shrink-0" size={24} />} data={c.prohibitedContent} />
        <SectionBlock icon={<Lock className="text-gold flex-shrink-0" size={24} />} data={c.copyright} />
        <SectionBlock icon={<CreditCard className="text-gold flex-shrink-0" size={24} />} data={c.payments} />
        <SectionBlock icon={<Mail className="text-gold flex-shrink-0" size={24} />} data={c.legalContact} />
        <SectionBlock icon={<AlertTriangle className="text-gold flex-shrink-0" size={24} />} data={c.ageNotice} />
        <SectionBlock icon={<FileText className="text-gold flex-shrink-0" size={24} />} data={c.terms} />
      </main>
      <Footer />
    </div>
  );
}
