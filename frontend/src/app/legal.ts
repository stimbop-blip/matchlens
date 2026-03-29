export const LEGAL_ACCEPTED_VERSION = "v1";

export type LegalLocale = "ru" | "en";

export type LegalSection = {
  title: string;
  body: string;
};

export type LegalDocument = {
  title: string;
  intro: string;
  sections: LegalSection[];
};

export type GateCopy = {
  title: string;
  subtitle: string;
  body: string;
  checkbox18: string;
  checkboxRules: string;
  checkboxPayment: string;
  buttonRules: string;
  buttonResponsible: string;
  buttonPayment: string;
  buttonContinue: string;
  buttonClose: string;
  blockedText: string;
};

export type MoreLinksCopy = {
  supportTitle: string;
  supportSubtitle: string;
  rulesTitle: string;
  rulesSubtitle: string;
  responsibleTitle: string;
  responsibleSubtitle: string;
  paymentTitle: string;
  paymentSubtitle: string;
};

export type LegalBundle = {
  gate: GateCopy;
  rules: LegalDocument;
  responsible: LegalDocument;
  paymentRefund: LegalDocument;
  moreLinks: MoreLinksCopy;
};

export const LEGAL_TEXTS: Record<LegalLocale, LegalBundle> = {
  ru: {
    gate: {
      title: "Добро пожаловать в PIT BET",
      subtitle: "Перед началом использования подтвердите возраст, ознакомление с правилами сервиса и условиями оплаты доступа.",
      body: "PIT BET — это информационно-аналитический сервис с сигналами, статистикой, обзорами, новостями и сервисными инструментами. Материалы сервиса носят информационный характер и предназначены только для совершеннолетних пользователей.",
      checkbox18: "Мне есть 18 лет",
      checkboxRules: "Я ознакомился с правилами сервиса",
      checkboxPayment: "Я ознакомился с условиями оплаты и возврата",
      buttonRules: "Открыть правила",
      buttonResponsible: "Ответственная игра",
      buttonPayment: "Оплата и возврат",
      buttonContinue: "Продолжить",
      buttonClose: "Закрыть приложение",
      blockedText: "Доступ к PIT BET возможен только после подтверждения возраста и ознакомления с правилами и условиями оплаты сервиса.",
    },
    rules: {
      title: "Правила использования PIT BET",
      intro:
        "PIT BET — это информационно-аналитический сервис. Сервис предоставляет пользователям сигналы, статистику, обзоры, новости и иной аналитический контент о спортивных событиях и игровых ситуациях.",
      sections: [
        {
          title: "Секция 1. О сервисе",
          body: "PIT BET не является букмекерской конторой или тотализатором, не принимает ставки, не организует азартные игры и не выплачивает выигрыши. Сервис предоставляет только аналитические и информационные материалы.",
        },
        {
          title: "Секция 2. Кто может пользоваться сервисом",
          body: "Сервис предназначен только для совершеннолетних пользователей. Если вам нет 18 лет, использование PIT BET не допускается.",
        },
        {
          title: "Секция 3. Характер аналитики",
          body: "Все материалы PIT BET носят исключительно аналитический, информационный и ознакомительный характер. Никакие сигналы, обзоры, статистика или новости не являются гарантией результата.",
        },
        {
          title: "Секция 4. Доступ и тарифы",
          body: "Часть материалов PIT BET может быть доступна только пользователям с активным тарифом. Оплата в PIT BET — это оплата доступа к аналитическому сервису и контенту, а не оплата ставки или участия в азартной игре.",
        },
        {
          title: "Секция 5. Ограничения использования",
          body: "Пользователю запрещается копировать, перепродавать, массово распространять материалы PIT BET без разрешения, передавать свой аккаунт третьим лицам или пытаться получить доступ к закрытым разделам сервиса в обход действующих ограничений.",
        },
        {
          title: "Секция 6. Ответственность пользователя",
          body: "Пользователь самостоятельно принимает любые решения на основе материалов PIT BET и полностью несёт за них ответственность. Команда PIT BET не несёт ответственности за финансовые потери, убытки или иные последствия, возникшие в результате использования аналитики сервиса.",
        },
        {
          title: "Секция 7. Поддержка",
          body: "По вопросам доступа, оплаты и работы сервиса пользователь может обратиться в поддержку через встроенный раздел поддержки.",
        },
        {
          title: "Секция 8. Персональные данные",
          body: "При использовании сервиса могут обрабатываться данные, необходимые для работы аккаунта, доступа, уведомлений, оплаты и поддержки. Подробности определяются политикой конфиденциальности сервиса.",
        },
        {
          title: "Секция 9. Принятие правил",
          body: "Используя PIT BET, пользователь подтверждает, что ознакомился с настоящими правилами, понимает аналитический характер сервиса и принимает эти условия в полном объёме.",
        },
      ],
    },
    responsible: {
      title: "Ответственная игра",
      intro: "PIT BET поддерживает ответственное отношение к ставкам и любым решениям, связанным с финансовым риском.",
      sections: [
        {
          title: "Секция 1. Важное предупреждение",
          body: "Участие в ставках и игровых решениях связано с риском потери денежных средств. Ни один сигнал, прогноз или аналитический материал не гарантирует результат.",
        },
        {
          title: "Секция 2. Только для совершеннолетних",
          body: "Сервис предназначен только для лиц старше 18 лет. Если вам нет 18 лет, не используйте материалы PIT BET.",
        },
        {
          title: "Секция 3. Аналитика не гарантирует результат",
          body: "Сигналы и обзоры PIT BET — это аналитика, а не обещание выигрыша. Даже качественная аналитика не исключает убытков.",
        },
        {
          title: "Секция 4. Контроль бюджета",
          body: "Используйте только те средства, потеря которых не повлияет на вашу жизнь, обязательства и базовые потребности. Не используйте для ставок последние деньги, кредитные средства или деньги на обязательные расходы.",
        },
        {
          title: "Секция 5. Лимиты",
          body: "Рекомендуется заранее определить лимит по сумме, времени и количеству игровых решений. Не увеличивайте сумму из-за эмоций, серии неудач или желания немедленно вернуть потери.",
        },
        {
          title: "Секция 6. Не играйте в уязвимом состоянии",
          body: "Не принимайте решения в состоянии стресса, усталости, под влиянием алкоголя или из-за желания отыграться.",
        },
        {
          title: "Секция 7. Признаки проблемного поведения",
          body: "Остановитесь и обратитесь за помощью, если вы замечаете у себя потерю контроля, постоянное желание отыграться, сокрытие расходов, использование заёмных денег или ухудшение качества жизни из-за ставок.",
        },
        {
          title: "Секция 8. Самоограничение",
          body: "Если вы чувствуете, что теряете контроль, ограничьте использование сервиса, отключите уведомления, сделайте паузу и откажитесь от платного доступа на период восстановления контроля.",
        },
        {
          title: "Секция 9. Роль PIT BET",
          body: "PIT BET не призывает к участию в азартных играх и не гарантирует финансовый результат. Сервис предоставляет аналитическую информацию, а пользователь самостоятельно принимает решения.",
        },
        {
          title: "Секция 10. Главное правило",
          body: "Если ставки начинают вредить финансам, отношениям, работе или психологическому состоянию, нужно остановиться.",
        },
      ],
    },
    paymentRefund: {
      title: "Оплата и возврат",
      intro:
        "Настоящие условия регулируют порядок оплаты доступа к сервису PIT BET и правила рассмотрения запросов на возврат денежных средств.",
      sections: [
        {
          title: "Секция 1. Что оплачивает пользователь",
          body: "Пользователь оплачивает доступ к информационно-аналитическому сервису PIT BET и соответствующему цифровому контенту в рамках выбранного тарифа. Оплата не является ставкой, интерактивной ставкой, участием в азартной игре или оплатой возможного выигрыша.",
        },
        {
          title: "Секция 2. Момент предоставления доступа",
          body: "Доступ к сервису считается предоставленным с момента активации тарифа, открытия соответствующих функций, материалов или закрытых разделов, предусмотренных выбранным уровнем доступа.",
        },
        {
          title: "Секция 3. Общее правило о возврате",
          body: "После активации доступа и начала фактического предоставления сервиса денежные средства, как правило, не подлежат возврату, за исключением случаев, прямо предусмотренных применимым законодательством Российской Федерации.",
        },
        {
          title: "Секция 4. Неиспользование сервиса",
          body: "Неиспользование пользователем сервиса, материалов, уведомлений или иных функций после активации доступа само по себе не является основанием для автоматического возврата денежных средств.",
        },
        {
          title: "Секция 5. Ошибочные и дублирующие платежи",
          body: "В случае ошибочного, дублирующего или технически некорректного списания пользователь вправе обратиться в поддержку. Такие обращения рассматриваются индивидуально с учётом фактических обстоятельств платежа и статуса доступа.",
        },
        {
          title: "Секция 6. Возврат до начала фактического предоставления доступа",
          body: "Если доступ не был фактически предоставлен, не был активирован или сервис не начал исполняться по вине сервиса, запрос на возврат может быть рассмотрен отдельно с учётом применимого законодательства и фактических обстоятельств.",
        },
        {
          title: "Секция 7. Ограничения",
          body: "Возврат не производится по мотивам несогласия с аналитикой, неудовлетворённости спортивным результатом, проигрыша, изменения рыночной ситуации, личных ожиданий пользователя или отказа от использования сервиса после получения доступа, кроме случаев, прямо предусмотренных законом.",
        },
        {
          title: "Секция 8. Порядок обращения",
          body: "Для рассмотрения вопроса по оплате или возврату пользователь должен обратиться в поддержку и указать данные аккаунта, дату платежа, сумму и описание проблемы.",
        },
        {
          title: "Секция 9. Срок и формат рассмотрения",
          body: "Каждое обращение рассматривается индивидуально. Решение принимается на основании статуса доступа, факта предоставления сервиса, платёжных данных и применимых норм права.",
        },
        {
          title: "Секция 10. Приоритет закона",
          body: "Если отдельные положения настоящего раздела отличаются от обязательных требований применимого законодательства, применяются нормы законодательства Российской Федерации.",
        },
      ],
    },
    moreLinks: {
      supportTitle: "Поддержка",
      supportSubtitle: "Открыть чат с командой PIT BET",
      rulesTitle: "Правила",
      rulesSubtitle: "Условия использования сервиса",
      responsibleTitle: "Ответственная игра",
      responsibleSubtitle: "Контроль рисков и самоограничение",
      paymentTitle: "Оплата и возврат",
      paymentSubtitle: "Условия оплаты доступа и рассмотрения обращений",
    },
  },
  en: {
    gate: {
      title: "Welcome to PIT BET",
      subtitle: "Before you continue, please confirm your age and that you have reviewed the service rules and payment terms.",
      body: "PIT BET is an information and analytics service with signals, statistics, insights, news, and service tools. All materials are informational in nature and intended for adult users only.",
      checkbox18: "I am 18 or older",
      checkboxRules: "I have reviewed the service rules",
      checkboxPayment: "I have reviewed the payment and refund terms",
      buttonRules: "Open rules",
      buttonResponsible: "Responsible gaming",
      buttonPayment: "Payment and refunds",
      buttonContinue: "Continue",
      buttonClose: "Close app",
      blockedText: "Access to PIT BET is available only after confirming your age and reviewing the service rules and payment terms.",
    },
    rules: {
      title: "PIT BET Terms of Use",
      intro:
        "PIT BET is an information and analytics service. The service provides users with signals, statistics, insights, news, and other analytical content related to sports events and betting situations.",
      sections: [
        {
          title: "Section 1. About the service",
          body: "PIT BET is not a bookmaker or tote, does not accept bets, does not organize gambling activities, and does not pay winnings. The service provides informational and analytical materials only.",
        },
        {
          title: "Section 2. Who may use the service",
          body: "The service is intended for adult users only. If you are under 18, you may not use PIT BET.",
        },
        {
          title: "Section 3. Nature of analytics",
          body: "All PIT BET materials are provided for informational and analytical purposes only. No signal, insight, statistic, or news item guarantees any result.",
        },
        {
          title: "Section 4. Access and plans",
          body: "Some PIT BET materials are available only to users with an active plan. Payment in PIT BET is payment for access to an analytics service and content, not payment for a bet or participation in gambling.",
        },
        {
          title: "Section 5. Usage restrictions",
          body: "Users may not copy, resell, or mass distribute PIT BET materials without permission, share accounts with third parties, or attempt to access restricted sections of the service by bypassing access controls.",
        },
        {
          title: "Section 6. User responsibility",
          body: "Users make all decisions independently based on PIT BET materials and bear full responsibility for them. The PIT BET team is not responsible for financial losses, damages, or any consequences arising from the use of analytics provided by the service.",
        },
        {
          title: "Section 7. Support",
          body: "For questions related to access, payments, or the operation of the service, users may contact support through the built-in support section.",
        },
        {
          title: "Section 8. Personal data",
          body: "The service may process data necessary for account operation, access, notifications, payments, and support. Details are governed by the service privacy policy.",
        },
        {
          title: "Section 9. Acceptance of terms",
          body: "By using PIT BET, the user confirms that they have reviewed these terms, understand the analytical nature of the service, and accept these conditions in full.",
        },
      ],
    },
    responsible: {
      title: "Responsible Gaming",
      intro: "PIT BET supports a responsible approach to betting and any decisions involving financial risk.",
      sections: [
        {
          title: "Section 1. Important warning",
          body: "Betting and game-related decisions involve the risk of losing money. No signal, prediction, or analytical material guarantees any result.",
        },
        {
          title: "Section 2. Adults only",
          body: "The service is intended for users aged 18 and older only. If you are under 18, do not use PIT BET materials.",
        },
        {
          title: "Section 3. Analytics do not guarantee results",
          body: "PIT BET signals and reviews are analytics, not promises of profit. Even high-quality analytics do not eliminate the risk of losses.",
        },
        {
          title: "Section 4. Budget control",
          body: "Use only money you can afford to lose without affecting your life, obligations, or essential needs. Do not use last-resort funds, credit money, or funds intended for required expenses.",
        },
        {
          title: "Section 5. Limits",
          body: "It is recommended to set limits in advance for amount, time, and number of betting decisions. Do not increase your spend because of emotions, losing streaks, or the urge to recover losses quickly.",
        },
        {
          title: "Section 6. Do not play in a vulnerable state",
          body: "Do not make decisions while stressed, exhausted, under the influence of alcohol, or driven by the desire to chase losses.",
        },
        {
          title: "Section 7. Signs of problematic behavior",
          body: "Stop and seek help if you notice loss of control, constant attempts to recover losses, hiding expenses, using borrowed money, or a decline in quality of life caused by betting.",
        },
        {
          title: "Section 8. Self-restriction",
          body: "If you feel you are losing control, limit your use of the service, disable notifications, take a break, and cancel paid access for a period while you regain control.",
        },
        {
          title: "Section 9. The role of PIT BET",
          body: "PIT BET does not encourage gambling and does not guarantee financial results. The service provides analytical information, and the user makes all decisions independently.",
        },
        {
          title: "Section 10. Main rule",
          body: "If betting starts harming your finances, relationships, work, or mental well-being, you need to stop.",
        },
      ],
    },
    paymentRefund: {
      title: "Payments and Refunds",
      intro: "These terms govern payment for access to the PIT BET service and the handling of refund requests.",
      sections: [
        {
          title: "Section 1. What the user pays for",
          body: "The user pays for access to the PIT BET information and analytics service and the corresponding digital content under the selected plan. Payment is not a bet, an interactive bet, participation in gambling, or payment for any potential winnings.",
        },
        {
          title: "Section 2. When access is considered provided",
          body: "Access to the service is considered provided from the moment the plan is activated and the corresponding functions, materials, or restricted sections included in that access level become available.",
        },
        {
          title: "Section 3. General refund rule",
          body: "After access has been activated and the service has started being actually provided, payments are generally non-refundable, except where required by applicable law.",
        },
        {
          title: "Section 4. Non-use of the service",
          body: "A user’s failure to use the service, materials, notifications, or other functions after access has been activated does not by itself constitute grounds for an automatic refund.",
        },
        {
          title: "Section 5. Erroneous or duplicate payments",
          body: "In the event of an erroneous, duplicate, or technically incorrect charge, the user may contact support. Such requests are reviewed individually based on the actual circumstances of the payment and the access status.",
        },
        {
          title: "Section 6. Refund before actual access is provided",
          body: "If access has not actually been provided, has not been activated, or the service has not started being performed due to the fault of the service, a refund request may be considered separately under applicable law and the factual circumstances.",
        },
        {
          title: "Section 7. Limitations",
          body: "Refunds are not issued merely because the user disagrees with the analytics, is dissatisfied with a sports result, loses money, faces a change in market conditions, has personal expectations, or decides not to use the service after access has been provided, except where required by law.",
        },
        {
          title: "Section 8. How to contact support",
          body: "To request a payment review or refund, the user must contact support and provide account details, payment date, amount, and a description of the issue.",
        },
        {
          title: "Section 9. Review process",
          body: "Each request is reviewed individually. A decision is made based on access status, whether the service was actually provided, payment data, and applicable law.",
        },
        {
          title: "Section 10. Governing law priority",
          body: "If any provision of this section differs from mandatory requirements of applicable law, the law of the Russian Federation prevails.",
        },
      ],
    },
    moreLinks: {
      supportTitle: "Support",
      supportSubtitle: "Open chat with the PIT BET team",
      rulesTitle: "Rules",
      rulesSubtitle: "Service terms of use",
      responsibleTitle: "Responsible gaming",
      responsibleSubtitle: "Risk awareness and self-control",
      paymentTitle: "Payments and refunds",
      paymentSubtitle: "Access payment terms and request handling",
    },
  },
};
