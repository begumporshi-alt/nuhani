import { Link } from 'react-router-dom'
import { useLanguage } from '../contexts/LanguageContext'

export default function NotFound() {
  const { t } = useLanguage()
  return (
    <div className="section-padding py-20 text-center animate-fade-in">
      <h1 className="text-6xl font-serif text-ink-800 mb-4">404</h1>
      <p className="text-ink-400 text-lg mb-8">{t('notfound.message')}</p>
      <Link to="/" className="btn-primary">{t('common.backHome')}</Link>
    </div>
  )
}
