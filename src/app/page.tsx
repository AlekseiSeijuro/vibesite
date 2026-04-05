import Link from 'next/link'
import { Sparkles, Zap, Globe, Shield } from 'lucide-react'
import HomeNav from '@/components/HomeNav'
import ExamplesSection from '@/components/ExamplesSection'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      <HomeNav />

      {/* Герой */}
      <section className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 px-4 py-1.5 text-sm text-brand-700 font-medium mb-8">
          <Sparkles className="h-4 w-4" />
          Powered by Claude AI
        </div>
        <h1 className="text-5xl sm:text-6xl font-bold text-gray-900 mb-6 text-balance">
          Сайт для мастера бьюти{' '}
          <span className="text-brand-600">за 2 минуты</span>
        </h1>
        <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto text-balance">
          Заполните анкету, загрузите фото работ — ИИ создаст красивый
          адаптивный сайт-визитку. Никакого кода и дизайнера.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/register" className="btn-primary text-base px-8 py-3">
            Создать сайт бесплатно
          </Link>
          <Link href="#examples" className="btn-secondary text-base px-8 py-3">
            Смотреть примеры
          </Link>
        </div>
        <p className="text-sm text-gray-400 mt-4">
          Демо-версия бесплатна — не нужно вводить данные карты или оплачивать заранее.
          Платный тариф подключается только если захотите убрать водяной знак.
        </p>
      </section>

      {/* Примеры сайтов */}
      <div id="examples">
        <ExamplesSection />
      </div>

      {/* Как работает */}
      <section id="how" className="py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Три шага до готового сайта
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: '01', title: 'Заполните анкету', desc: 'Укажите нишу, имя, услуги с ценами и контакты. Это займёт 3–5 минут.' },
              { step: '02', title: 'Загрузите фото', desc: 'Добавьте 5–10 фотографий своих работ. ИИ подберёт цвета под ваш стиль.' },
              { step: '03', title: 'Получите сайт', desc: 'Claude создаёт уникальный адаптивный HTML/CSS сайт. Опубликуйте одной кнопкой.' },
            ].map((item) => (
              <div key={item.step} className="card">
                <div className="text-4xl font-bold text-brand-100 mb-4">{item.step}</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Возможности */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Всё что нужно мастеру
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { icon: Zap,      title: 'Быстро',     desc: 'Сайт готов через 2 минуты после заполнения анкеты' },
              { icon: Globe,    title: 'Свой адрес', desc: 'Поддомен вида имя.beauty-site.ru или ваш собственный домен' },
              { icon: Shield,   title: 'Адаптивный', desc: 'Корректно отображается на телефоне, планшете и компьютере' },
              { icon: Sparkles, title: 'Уникальный', desc: 'Каждый сайт генерируется индивидуально, не шаблон' },
            ].map((item) => (
              <div key={item.title} className="card text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-brand-50 mb-4">
                  <item.icon className="h-6 w-6 text-brand-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-brand-600 py-20">
        <div className="mx-auto max-w-2xl px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Готовы попробовать?</h2>
          <p className="text-brand-100 mb-8">Демо-версия бесплатна — регистрация без оплаты.</p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3 text-base font-medium text-brand-600 transition hover:bg-brand-50"
          >
            <Sparkles className="h-5 w-5" />
            Создать сайт бесплатно
          </Link>
        </div>
      </section>

      {/* Футер */}
      <footer className="border-t border-gray-100 py-8">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-gray-500">
            <Sparkles className="h-4 w-4 text-brand-600" />
            <span className="text-sm font-medium">Vibesite</span>
          </div>
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} Vibesite. Все права защищены.
          </p>
          <p className="text-sm text-gray-400">
            ИНН 575213448940
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 text-sm text-gray-400">
            <a href="tel:+79103025790" className="hover:text-gray-600 transition-colors">
              📞 8 910 302 57 90
            </a>
            <Link href="/privacy" className="hover:text-gray-600">Конфиденциальность</Link>
            <Link href="/terms" className="hover:text-gray-600">Условия</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
