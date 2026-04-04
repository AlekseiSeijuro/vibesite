import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Политика конфиденциальности — Vibesite',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-100">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-brand-600" />
            <span className="font-bold text-gray-900">Vibesite</span>
          </Link>
          <Link href="/" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            ← На главную
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 sm:p-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Политика конфиденциальности</h1>
          <p className="text-gray-400 text-sm mb-8">Последнее обновление: 1 апреля 2026 г.</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Общие положения</h2>
              <p>
                Настоящая Политика конфиденциальности определяет порядок обработки и защиты персональных данных
                пользователей сервиса Vibesite (далее — «Сервис»), доступного по адресу beauty-site.ru.
                Используя Сервис, вы соглашаетесь с условиями настоящей Политики.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Какие данные мы собираем</h2>
              <p>При использовании Сервиса мы можем собирать следующие данные:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Адрес электронной почты — при регистрации и входе в аккаунт</li>
                <li>Данные профиля — имя мастера, название студии, город, контакты, услуги и цены, которые вы вводите при создании сайта</li>
                <li>Фотографии — загружаемые вами изображения работ</li>
                <li>Технические данные — IP-адрес, тип браузера, страницы посещений (в целях аналитики и безопасности)</li>
                <li>Платёжные данные — обрабатываются исключительно платёжным сервисом ЮKassa и не хранятся на наших серверах</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Как мы используем данные</h2>
              <p>Собранные данные используются для:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Предоставления услуг Сервиса — генерации и публикации сайтов-визиток</li>
                <li>Авторизации и управления аккаунтом</li>
                <li>Обработки платежей и ведения истории подписок</li>
                <li>Технической поддержки и ответов на обращения</li>
                <li>Улучшения качества Сервиса</li>
                <li>Отправки уведомлений, связанных с работой Сервиса</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Хранение и защита данных</h2>
              <p>
                Данные хранятся в защищённой базе данных Supabase (PostgreSQL) с применением
                шифрования и политик разграничения доступа. Фотографии хранятся в объектном хранилище
                Yandex Cloud. Мы принимаем технические и организационные меры для защиты ваших данных
                от несанкционированного доступа, изменения или уничтожения.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Передача данных третьим лицам</h2>
              <p>
                Мы не передаём ваши персональные данные третьим лицам, за исключением:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Платёжного сервиса ЮKassa — для обработки платежей</li>
                <li>Провайдеров инфраструктуры (Supabase, Yandex Cloud, Vercel) — в рамках оказания услуг хостинга</li>
                <li>Случаев, предусмотренных законодательством Российской Федерации</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Публичные сайты пользователей</h2>
              <p>
                Данные, которые вы вводите при создании сайта (имя, контакты, услуги, фотографии),
                публикуются на вашем сайте-визитке и становятся общедоступными. Вы самостоятельно
                несёте ответственность за размещаемую информацию.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Ваши права</h2>
              <p>Вы вправе:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Запросить копию хранящихся о вас данных</li>
                <li>Потребовать исправления неточных данных</li>
                <li>Удалить аккаунт и все связанные данные через раздел «Настройки»</li>
                <li>Отозвать согласие на обработку данных</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Cookies</h2>
              <p>
                Сервис использует cookies для поддержания сессии авторизации и корректной работы
                интерфейса. Используя Сервис, вы соглашаетесь с использованием cookies.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Контакты</h2>
              <p>
                По вопросам обработки персональных данных обращайтесь по телефону{' '}
                <a href="tel:+79103025790" className="text-brand-600 hover:underline">8 910 302 57 90</a>
                {' '}или через раздел{' '}
                <Link href="/dashboard/support" className="text-brand-600 hover:underline">Поддержка</Link>.
              </p>
            </section>

          </div>
        </div>
      </main>

      <footer className="py-6 text-center text-sm text-gray-400">
        © {new Date().getFullYear()} Vibesite ·{' '}
        <Link href="/terms" className="hover:text-gray-600">Условия использования</Link>
      </footer>
    </div>
  )
}
