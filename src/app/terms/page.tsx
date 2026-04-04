import Link from 'next/link'
import { Sparkles } from 'lucide-react'

export const metadata = {
  title: 'Условия использования — Vibesite',
}

export default function TermsPage() {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Условия использования</h1>
          <p className="text-gray-400 text-sm mb-8">Последнее обновление: 1 апреля 2026 г.</p>

          <div className="prose prose-gray max-w-none space-y-8 text-gray-600 text-sm leading-relaxed">

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">1. Общие положения</h2>
              <p>
                Настоящие Условия использования регулируют отношения между пользователем и сервисом
                Vibesite (далее — «Сервис»), доступным по адресу beauty-site.ru. Регистрируясь и
                используя Сервис, вы принимаете настоящие Условия в полном объёме.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">2. Описание сервиса</h2>
              <p>
                Vibesite — это онлайн-сервис для автоматического создания сайтов-визиток для мастеров
                и салонов сферы красоты с помощью искусственного интеллекта. Сервис позволяет создавать,
                редактировать и публиковать одностраничные сайты на поддоменах beauty-site.ru.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">3. Регистрация и аккаунт</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Для использования Сервиса необходима регистрация с действующим адресом электронной почты</li>
                <li>Вы несёте ответственность за сохранность учётных данных и за все действия, совершённые с вашего аккаунта</li>
                <li>Один человек вправе иметь только один аккаунт</li>
                <li>Мы вправе заблокировать аккаунт при нарушении настоящих Условий</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">4. Тарифы и оплата</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Сервис предоставляется на условиях, описанных на странице{' '}
                  <Link href="/pricing" className="text-brand-600 hover:underline">Тарифы</Link>
                </li>
                <li>Демо-тариф предоставляется бесплатно с ограничениями: 1 сайт, водяной знак, без публикации на поддомене</li>
                <li>Оплата производится через платёжный сервис ЮKassa. Возврат средств осуществляется в соответствии с законодательством РФ</li>
                <li>Мы вправе изменять стоимость тарифов, уведомив пользователей не менее чем за 7 дней</li>
                <li>При отмене подписки доступ к платным функциям сохраняется до конца оплаченного периода</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">5. Контент пользователя</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Вы сохраняете все права на контент (тексты, фотографии), который загружаете в Сервис</li>
                <li>Загружая контент, вы предоставляете нам право на его хранение и отображение в рамках работы Сервиса</li>
                <li>Запрещено размещать контент, нарушающий права третьих лиц, законодательство РФ, содержащий недостоверную информацию или материалы для взрослых</li>
                <li>Мы вправе удалить контент, нарушающий настоящие Условия, без предварительного уведомления</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">6. Использование AI-генерации</h2>
              <ul className="list-disc pl-5 space-y-1">
                <li>Сервис использует модели искусственного интеллекта для генерации HTML-кода сайтов</li>
                <li>Результат генерации может отличаться при каждом запросе — это особенность технологии</li>
                <li>Мы не гарантируем, что сгенерированный контент будет полностью соответствовать вашим ожиданиям</li>
                <li>Вы несёте ответственность за проверку и публикацию сгенерированного сайта</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">7. Ограничение ответственности</h2>
              <p>
                Сервис предоставляется «как есть». Мы не несём ответственности за:
              </p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                <li>Временную недоступность Сервиса по техническим причинам</li>
                <li>Потерю данных вследствие обстоятельств непреодолимой силы</li>
                <li>Действия третьих лиц, получивших доступ к вашему аккаунту по вашей вине</li>
                <li>Содержание сайтов, опубликованных пользователями</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">8. Интеллектуальная собственность</h2>
              <p>
                Все элементы Сервиса (дизайн, код, логотип, наименование Vibesite) являются
                интеллектуальной собственностью владельцев Сервиса и защищены законодательством.
                HTML-код сгенерированных сайтов передаётся пользователю только при оплате тарифа
                «Свой домен».
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">9. Изменение условий</h2>
              <p>
                Мы вправе изменять настоящие Условия. Об изменениях мы уведомим по электронной почте
                или через интерфейс Сервиса. Продолжение использования Сервиса после уведомления
                означает согласие с новыми условиями.
              </p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">10. Контакты</h2>
              <p>
                По вопросам, связанным с настоящими Условиями, обращайтесь по телефону{' '}
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
        <Link href="/privacy" className="hover:text-gray-600">Политика конфиденциальности</Link>
      </footer>
    </div>
  )
}
