export type Locale = 'en' | 'fr' | 'de' | 'es' | 'it' | 'pt';

type Dict = Record<string, string>;

const en: Dict = {
  'nav.home': 'Home',
  'nav.dashboard': 'Dashboard',
  'nav.content': 'Content',
  'nav.pricing': 'Pricing',
  'nav.privacy': 'Privacy',
  'nav.terms': 'Terms',
  'auth.login': 'Log in',
  'auth.signup': 'Sign up',
  'auth.signout': 'Sign out',
  'cta.newCheck': 'New Check',
};

const fr: Dict = {
  'nav.home': 'Accueil',
  'nav.dashboard': 'Tableau de bord',
  'nav.content': 'Contenu',
  'nav.pricing': 'Tarifs',
  'nav.privacy': 'Confidentialité',
  'nav.terms': 'Conditions',
  'auth.login': 'Se connecter',
  'auth.signup': 'S’inscrire',
  'auth.signout': 'Se déconnecter',
  'cta.newCheck': 'Nouvelle vérification',
};

const de: Dict = {
  'nav.home': 'Start',
  'nav.dashboard': 'Dashboard',
  'nav.content': 'Inhalte',
  'nav.pricing': 'Preise',
  'nav.privacy': 'Datenschutz',
  'nav.terms': 'Nutzungsbedingungen',
  'auth.login': 'Anmelden',
  'auth.signup': 'Registrieren',
  'auth.signout': 'Abmelden',
  'cta.newCheck': 'Neue Prüfung',
};

const es: Dict = {
  'nav.home': 'Inicio',
  'nav.dashboard': 'Panel',
  'nav.content': 'Contenido',
  'nav.pricing': 'Precios',
  'nav.privacy': 'Privacidad',
  'nav.terms': 'Términos',
  'auth.login': 'Iniciar sesión',
  'auth.signup': 'Registrarse',
  'auth.signout': 'Cerrar sesión',
  'cta.newCheck': 'Nueva verificación',
};

const it: Dict = {
  'nav.home': 'Home',
  'nav.dashboard': 'Dashboard',
  'nav.content': 'Contenuti',
  'nav.pricing': 'Prezzi',
  'nav.privacy': 'Privacy',
  'nav.terms': 'Termini',
  'auth.login': 'Accedi',
  'auth.signup': 'Iscriviti',
  'auth.signout': 'Esci',
  'cta.newCheck': 'Nuovo controllo',
};

const pt: Dict = {
  'nav.home': 'Início',
  'nav.dashboard': 'Painel',
  'nav.content': 'Conteúdo',
  'nav.pricing': 'Preços',
  'nav.privacy': 'Privacidade',
  'nav.terms': 'Termos',
  'auth.login': 'Entrar',
  'auth.signup': 'Cadastrar',
  'auth.signout': 'Sair',
  'cta.newCheck': 'Nova verificação',
};

export const dictionaries: Record<Locale, Dict> = { en, fr, de, es, it, pt };

export function resolveInitialLocale(): Locale {
  if (typeof window === 'undefined') return 'en';
  const saved = (localStorage.getItem('lang') || '').toLowerCase();
  if (['en', 'fr', 'de', 'es', 'it', 'pt'].includes(saved)) return saved as Locale;
  const nav = navigator.language?.slice(0, 2).toLowerCase();
  if (['en', 'fr', 'de', 'es', 'it', 'pt'].includes(nav)) return nav as Locale;
  return 'en';
}

