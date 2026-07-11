// @ts-check
// Registry of job-scam archetypes powering the /scams hub pages.
// Pure, evergreen editorial data — no user/report data, no external calls.
// Types live in ./scam-patterns.d.ts. Imported by app/scams/* and lib/scam-seo.mjs.

/** @typedef {import('./scam-patterns').ScamPattern} ScamPattern */

/** @type {ScamPattern[]} */
export const SCAM_PATTERNS = [
  {
    "slug": "upfront-fee",
    "name": "Upfront-fee job scams",
    "aka": [
      "Pay-to-start job scams",
      "Registration fee scams",
      "Training fee scams",
      "Placement fee scams"
    ],
    "searchTitle": "Should I pay an upfront fee to get this job?",
    "metaDescription": "Real employers never make you pay to start. Learn how upfront-fee job scams work, their red flags, and what to do if you were asked to pay.",
    "summary": "In an upfront-fee job scam, an employer asks you to pay money before you start work — for training, registration, a background check, or a required starter kit — and then the job never materializes or the money simply disappears.",
    "howItWorks": [
      "You receive a job offer that feels easy to get, often with little or no real interview.",
      "Before you can start, the employer says you must first pay for training, registration, a background check, or a starter kit.",
      "They tell you the fee is normal or fully refundable and pressure you to pay quickly to hold your slot.",
      "You send the payment through a method that is hard to reverse, such as a bank transfer, e-wallet, or gift cards.",
      "The job never begins, the promised refund never comes, and the employer goes silent or asks for even more fees."
    ],
    "redFlags": [
      "You are asked to pay any amount before you have done any work or received any pay.",
      "The fee is framed as a training, registration, background-check, or starter-kit cost that you must cover yourself.",
      "You are told the payment is refundable from your first paycheck, but you must send it now.",
      "The money must go to a personal account, an e-wallet, or in gift cards instead of an official company invoice.",
      "The offer arrived with almost no screening and the recruiter pushes you to pay fast before the slot is gone.",
      "The company name, email address, or website looks slightly off or cannot be verified anywhere."
    ],
    "whatToDo": [
      "Do not send any money, and cancel the payment immediately if a transfer is still pending.",
      "Tell the employer you will only continue if the job requires no payment from you, and watch how they react.",
      "Search the company name alongside words like 'fee' or 'scam' and confirm the recruiter through the company's official website.",
      "If you already paid, contact your bank or e-wallet provider right away to try to reverse or freeze the transfer.",
      "Report the scam to your local authorities or job-fraud reporting body, and warn others where you saw the post."
    ],
    "faq": [
      {
        "question": "Do real employers ever charge a fee to start a job?",
        "answer": "No legitimate employer requires you to pay them to be hired or to begin working, because the cost of hiring and training is always the employer's responsibility."
      },
      {
        "question": "They said the training fee is refundable from my first paycheck — is that safe?",
        "answer": "No, this is a common trick, because once you pay, the job or the refund usually never appears, and a genuine job would simply pay you normally without asking for money first."
      },
      {
        "question": "I already paid an upfront fee. Can I get my money back?",
        "answer": "Contact your bank or e-wallet provider immediately, since fast action sometimes lets a transfer be reversed or frozen, and keep every message and receipt as evidence."
      },
      {
        "question": "What if the fee is small, like for a background check?",
        "answer": "Even a small fee is a warning sign, because legitimate background checks are arranged and paid for by the employer, not billed to you before you start."
      },
      {
        "question": "How can I tell a real job cost apart from a scam fee?",
        "answer": "A real job never asks you to send money in order to be hired, so any request to pay to start, no matter the reason given, should be treated as a scam."
      }
    ],
    "relatedSlugs": ["equipment-kit", "crypto-deposit"]
  },
  {
    "slug": "whatsapp-telegram-task",
    "name": "WhatsApp & Telegram task scams",
    "aka": [
      "Task scams",
      "Commission task scams",
      "App-based job scams",
      "Prepaid task scams",
      "Like-and-earn jobs",
      "Gamified job scams"
    ],
    "searchTitle": "Is this WhatsApp task job a scam?",
    "metaDescription": "A recruiter moved you to WhatsApp or Telegram and now wants deposits for paid \"tasks.\" Learn how this task scam works and how to protect yourself.",
    "summary": "A supposed recruiter skips a real interview and moves you to WhatsApp or Telegram, then hands you simple paid \"tasks\" that soon require your own deposits. The small early payouts are bait; once you deposit larger sums to \"unlock\" earnings, the money and the job disappear.",
    "howItWorks": [
      "A stranger messages you out of the blue offering easy, high-paying remote work, often naming a well-known brand or agency.",
      "They skip a real interview and push you onto WhatsApp or Telegram, where a \"mentor\" walks you through the platform.",
      "You do simple tasks like liking posts, reviewing products, or clicking items, and receive a small payout to build your trust.",
      "You are told to deposit your own money, often crypto or an e-wallet transfer, to unlock higher-paying tasks or to withdraw your earnings.",
      "The deposits keep rising, your \"balance\" never pays out, and eventually you are pressured, frozen, or blocked with your money gone."
    ],
    "redFlags": [
      "The job was offered by an unsolicited message and never involved a real interview or video call.",
      "The conversation was moved to WhatsApp or Telegram almost immediately instead of company email.",
      "You are asked to deposit, top up, or \"invest\" your own money to earn or to withdraw earnings.",
      "The pay is unrealistic for the work, like a large daily sum just to like posts or click items.",
      "A group chat is full of members posting withdrawal screenshots and urging you to deposit more.",
      "Your \"earnings\" show in an app but are locked until you complete a streak of paid tasks."
    ],
    "whatToDo": [
      "Stop sending money immediately, no matter how much you have already deposited or how close a \"withdrawal\" seems.",
      "Do not deposit more to recover what you lost, since that is exactly how the scam drains victims further.",
      "Contact your bank or e-wallet provider right away to report fraud and ask about reversing recent transfers.",
      "Save screenshots of the chats, profiles, app, and payment records as evidence before you are blocked.",
      "Report the scam to your local police or cybercrime authority and block the contacts across all apps."
    ],
    "faq": [
      {
        "question": "I already received a small payment, so isn't the job real?",
        "answer": "No. Paying you a small amount early is a deliberate tactic to earn your trust so you will deposit much larger sums later, which you never get back."
      },
      {
        "question": "They say I just need one more deposit to withdraw my earnings. Is that true?",
        "answer": "No. The \"one more deposit\" never ends, and the balance you see in the app is fake. Legitimate jobs pay you; they never require you to pay to get paid."
      },
      {
        "question": "Can I get my money back after depositing?",
        "answer": "Sometimes, if you act fast. Contact your bank or e-wallet provider within a day or two to request a reversal, and file a report with authorities, though recovery is not guaranteed."
      },
      {
        "question": "Why did they move me to WhatsApp or Telegram so quickly?",
        "answer": "These apps let scammers work anonymously, delete accounts, and block you instantly. A real employer communicates through official company channels and conducts an actual interview."
      },
      {
        "question": "How can I tell a real remote job from this scam?",
        "answer": "A real job interviews you, never asks you to pay or deposit money, uses official company channels, and can verify who they are on a live video call."
      }
    ],
    "relatedSlugs": ["upfront-fee", "fake-recruiter"]
  },
  {
    "slug": "reshipping-money-mule",
    "name": "Reshipping & money-mule scams",
    "aka": [
      "package-forwarding job scam",
      "reshipping scam",
      "money mule scam",
      "payment-processing agent scam",
      "financial agent scam"
    ],
    "searchTitle": "Is this reshipping or payment-processing job a scam?",
    "metaDescription": "A package-forwarding or payment-processing job can turn you into a money mule for stolen goods or cash. How to spot it and stay safe.",
    "summary": "A real job pays you for your work — it never routes stolen parcels or money through you. Reshipping and money-mule roles use your name, home address, and bank account to move goods bought with stolen cards or to launder cash, leaving you legally exposed.",
    "howItWorks": [
      "You are hired fast for a work-from-home 'package forwarding', 'payment processing', 'logistics', or 'financial agent' role, usually with no real interview.",
      "You are told to receive packages or money at your own home, in your own name, or into your own bank or e-wallet account.",
      "You reship the parcels to another address, often overseas, using prepaid labels they send you, or you forward the money onward and keep a small 'commission'.",
      "The goods were bought with stolen cards and the money is proceeds of fraud, so you become the layer that hides the criminal's trail.",
      "When banks or police trace the activity it leads to you: your account is frozen and you can be investigated while the 'employer' disappears."
    ],
    "redFlags": [
      "The job asks you to receive packages at your home and forward them to another address, often abroad.",
      "You are told to use your own bank account, card, or e-wallet to receive and pass on payments.",
      "You are paid a commission or percentage for each package or payment you 'process'.",
      "Packages arrive in your name from stores you never ordered from, with prepaid shipping labels emailed to you.",
      "The company has no verifiable office, business registration, or phone number you can confirm yourself.",
      "You are pushed to open a new bank account or share existing account details right after being hired."
    ],
    "whatToDo": [
      "Stop immediately: do not ship any package or move any money, even one you already agreed to handle.",
      "Do not open a new bank account or hand over your existing account or card details for the role.",
      "Save every message, label, and transaction record, because you may need it to show you were deceived.",
      "Tell your bank right away if your account was used, and report it to the police or your country's cybercrime unit.",
      "Verify the company yourself through official registries and a phone number you look up independently before trusting any 'employer'."
    ],
    "faq": [
      {
        "question": "Can I get in trouble even though I didn't know it was a scam?",
        "answer": "Yes. Handling stolen goods or moving criminal money is illegal regardless of your intent, and proving you 'didn't know' is hard after the fact, which is why stopping the moment you suspect something matters so much."
      },
      {
        "question": "I already shipped a package or moved money — what do I do now?",
        "answer": "Stop all further activity, keep every message and record, tell your bank if your account was involved, and report it to your local police or cybercrime unit. Coming forward early works in your favor."
      },
      {
        "question": "Why would a company use my personal address and bank account?",
        "answer": "To hide the criminal's identity. Your name and address break the trail between the stolen goods or funds and the fraudster, which makes you the person investigators find first."
      },
      {
        "question": "Isn't 'package forwarding' or 'payment processing' a real job?",
        "answer": "Legitimate logistics and payment companies use their own commercial facilities, business accounts, and vetted systems. A real employer never routes shipments or funds through an employee's home address or personal bank account."
      },
      {
        "question": "They sent me a contract and an ID badge — doesn't that make it legitimate?",
        "answer": "No. Scammers easily produce fake contracts, badges, and IDs to look convincing. Documents prove nothing on their own; only independent verification of the company does."
      }
    ],
    "relatedSlugs": ["check-overpayment", "data-harvesting"]
  },
  {
    "slug": "check-overpayment",
    "name": "Check & overpayment scams",
    "aka": [
      "Overpayment scam",
      "Fake check scam",
      "Check overpayment scam",
      "Refund-the-difference scam",
      "Equipment or supplies payment scam"
    ],
    "searchTitle": "Is this overpayment check refund a job scam?",
    "metaDescription": "You're \"overpaid\" by check or transfer and told to send the extra back or buy supplies. The payment bounces later and you owe it. How to spot it.",
    "summary": "A supposed employer pays you more than expected, then asks you to send the extra back or use it to buy equipment or supplies. The original check or transfer later bounces, leaving you owing your bank every peso or dollar you moved.",
    "howItWorks": [
      "You are hired quickly and told your first payment, equipment budget, or reimbursement is on the way, often before any real work begins.",
      "A check, mobile deposit, or bank transfer arrives for more than you were promised, and they call it a mistake or an advance for supplies.",
      "They pressure you to send the extra back, or to buy a laptop, gift cards, or software from a specific vendor they name.",
      "Your bank shows the money as available within a day or two, so it looks real and you move the funds as instructed.",
      "Weeks later the bank discovers the payment was fake, reverses it, and holds you responsible for the full amount you already sent."
    ],
    "redFlags": [
      "You are paid or sent an equipment budget before doing any real work or signing a genuine contract.",
      "The amount is higher than agreed and they ask you to return the difference to them or a third party.",
      "You are told to buy laptops, phones, gift cards, or software from a specific seller they choose.",
      "They rush you to send money back the same day, before your bank has truly cleared it.",
      "The refund must go out by wire, gift card, crypto, or e-wallet transfer rather than a normal reversal.",
      "The employer avoids video calls, uses free email addresses, and cannot show a verifiable company."
    ],
    "whatToDo": [
      "Do not send any money back or buy anything until the payment has fully and finally cleared, which can take several weeks.",
      "Call your bank directly and ask whether the check or transfer has truly settled, not just been made available.",
      "Refuse to buy equipment or gift cards from a vendor the employer names, and never share card codes.",
      "Keep every message, receipt, and check image, then stop replying to the person who sent the money.",
      "Report it to your bank and to your local authorities or fraud agency so the account can be flagged."
    ],
    "faq": [
      {
        "question": "The money already showed up in my account, so isn't it safe to spend?",
        "answer": "No, banks are required to make deposited funds available quickly, but that is not the same as the payment being verified. It can take weeks to discover a check or transfer is fake, and if it is, the bank takes the money back and you owe whatever you already sent."
      },
      {
        "question": "Why would a real employer ever overpay me and ask for the difference back?",
        "answer": "A legitimate employer corrects a payroll error internally and never asks you to wire, gift-card, or transfer money back to them personally. Being overpaid and told to refund the extra yourself is a core sign of this scam, not a normal business practice."
      },
      {
        "question": "They only want me to buy a laptop and software, not send cash back. Is that different?",
        "answer": "It is the same scam in another form. The equipment payment is fake, and once you buy from their chosen vendor or with gift cards, that money is gone while the original payment later bounces and leaves you liable."
      },
      {
        "question": "I already sent the money back. What should I do now?",
        "answer": "Contact your bank immediately, explain what happened, and ask if any transfer can still be stopped or recovered. Save all records and report it to your local authorities or fraud agency, since fast action gives the best chance of limiting the loss."
      },
      {
        "question": "How can I tell a fake check or transfer from a real one before I act?",
        "answer": "You often cannot tell by looking, because fakes can appear genuine and even show as available in your account. The safest test is time and your bank: wait until the payment has fully settled and confirm it directly with the bank before moving any money."
      }
    ],
    "relatedSlugs": ["reshipping-money-mule", "upfront-fee"]
  },
  {
    "slug": "crypto-deposit",
    "name": "Crypto-deposit & buy-to-work scams",
    "aka": [
      "Task scam",
      "Crypto task scam",
      "Recharge and tasking scam",
      "Buy-to-work scam",
      "Commission task fraud",
      "Gamified job scam"
    ],
    "searchTitle": "Is a job that asks me to deposit crypto a scam?",
    "metaDescription": "A job that makes you deposit crypto to unlock tasks or earn commissions is a task scam. Learn the red flags and how to protect yourself and your money.",
    "summary": "This is a task or commission scam where a fake \"job\" makes you deposit your own cryptocurrency to unlock tasks, boost commissions, or buy products before you can earn. The earnings you see are fake, and every attempt to withdraw triggers a new demand for more money.",
    "howItWorks": [
      "A recruiter contacts you out of the blue by text, WhatsApp, or Telegram offering easy remote work like liking videos, rating products, or completing simple online tasks.",
      "You finish a few tasks and receive a small real payout, which makes the job feel legitimate and lowers your guard.",
      "The platform then tells you to deposit your own crypto to unlock higher-paying tasks, boost your commission, or buy the products you are supposedly promoting.",
      "When you try to withdraw, a new obstacle appears every time, such as a frozen account, a negative balance, a tax, or a VIP upgrade, each demanding a larger deposit.",
      "The deposits never release your money, because the platform, the balance, and the earnings were fake from the start."
    ],
    "redFlags": [
      "The job requires you to deposit, recharge, or send your own money before you can be paid.",
      "You are asked to pay in cryptocurrency through a wallet address, app, or QR code.",
      "Your account suddenly shows a negative balance or frozen status that only a deposit will fix.",
      "Each attempt to withdraw triggers a new fee, tax, or VIP upgrade you never agreed to.",
      "All contact happens on WhatsApp or Telegram, never through a verifiable company email or office.",
      "You received a small early payout that made the larger deposits feel safe."
    ],
    "whatToDo": [
      "Stop sending money immediately, no matter how close your balance looks to a withdrawal.",
      "Do not deposit more to try to recover what you already lost, because that is exactly how the trap deepens.",
      "Take screenshots of the platform, chats, wallet addresses, and any transaction records before you lose access.",
      "Report the scam to your local police, your financial or securities regulator, and the crypto exchange or app you used.",
      "Warn anyone who referred you or whom you referred, since these scams use referral bonuses to pull in friends and family."
    ],
    "faq": [
      {
        "question": "Can I get my crypto back?",
        "answer": "Crypto payments are very hard to reverse, but report the transaction to the exchange and your local authorities as fast as you can, because quick reporting gives the best chance of a trace or a freeze."
      },
      {
        "question": "They already paid me once, so doesn't that mean the job is real?",
        "answer": "A small early payout is a deliberate tactic to win your trust before asking for much larger deposits, and it does not make the job legitimate."
      },
      {
        "question": "Why does my account show a big balance I can't withdraw?",
        "answer": "The balance is just a number on a screen the scammers fully control, designed to make you keep depositing to release money that does not actually exist."
      },
      {
        "question": "Is this the same as the task jobs advertised on social media?",
        "answer": "Many of these scams start from social media ads or unsolicited messages promising easy commission for simple tasks, so treat any task job that later asks for a deposit as fraud."
      },
      {
        "question": "A well-known company was named, so could it still be a scam?",
        "answer": "Scammers often borrow the names of trusted shopping or delivery brands to look real, so verify only through the company's official website and never through the recruiter's links."
      }
    ],
    "relatedSlugs": ["upfront-fee", "whatsapp-telegram-task"]
  },
  {
    "slug": "fake-recruiter",
    "name": "Fake-recruiter & cloned job scams",
    "aka": [
      "Recruiter impersonation scam",
      "Cloned job posting scam",
      "Fake job offer scam",
      "Lookalike domain job scam",
      "Brand impersonation recruitment scam"
    ],
    "searchTitle": "Is this recruiter real or a fake job scam?",
    "metaDescription": "How fake recruiters clone real companies and job posts, the red flags to check, and how to verify a recruiter is genuine before you reply or pay.",
    "summary": "A scammer pretends to be a real company or recruiter, often by copying a genuine job post and writing from an email or website address that looks almost right. The goal is to win your trust so you hand over personal details, documents, or money.",
    "howItWorks": [
      "The scammer copies a real job advert, company name, and logo, then reposts it on a job board or messages you directly.",
      "They contact you from an email or website that looks almost identical to the real company's, often with one extra word, a swapped letter, or a different ending.",
      "They move you quickly onto a chat app like WhatsApp or Telegram and run a short, friendly interview that barely tests your skills.",
      "They send an official-looking offer letter to lower your guard and make the role feel real.",
      "They ask for your personal documents, bank details, or an upfront payment for training, equipment, or processing."
    ],
    "redFlags": [
      "The email address is not the company's real domain, using a free account or a near-match with an extra word, letter, or different ending.",
      "You were contacted out of the blue for a job you never applied to.",
      "The pay and benefits sound far higher than the work being described.",
      "The interview happens only over text or chat apps, with no proper video call or verifiable office number.",
      "You are asked to pay for training, equipment, a visa, or a background check before you start.",
      "The recruiter pressures you to decide, sign, or send documents quickly."
    ],
    "whatToDo": [
      "Stop and verify before you reply, send any document, or pay anything.",
      "Find the company's official website yourself and check whether the job is actually listed on their careers page.",
      "Call the company's main number from their official site, not the one in the message, and ask HR to confirm the role and the recruiter's name.",
      "Read the sender's email address slowly, character by character, and compare it against the real company's domain.",
      "Report the impersonation to the job board, the real company, and your local authorities, such as the NBI Anti-Fraud and Cybercrime Division or the PNP Anti-Cybercrime Group in the Philippines."
    ],
    "faq": [
      {
        "question": "The recruiter used the real company's name and logo, so doesn't that mean it's real?",
        "answer": "No. Names, logos, and even word-for-word job descriptions are easy to copy and reuse. Only checking through the company's own official contact details tells you whether the recruiter really works there."
      },
      {
        "question": "How can an email address look almost exactly like the real company's?",
        "answer": "Scammers register lookalike domains that change one small detail, such as adding a word, swapping a single letter, or changing the ending from .com to .co or .net. Read everything after the @ symbol slowly and compare it to the address shown on the company's official website."
      },
      {
        "question": "I already sent my CV and a copy of my ID. What should I do now?",
        "answer": "Stop all further contact and do not send money or more documents. Watch your bank and email accounts for unusual activity, tell your bank if you shared any financial details, and save screenshots of every message as evidence for a report."
      },
      {
        "question": "They asked me to pay for training or equipment before I start. Is that ever normal?",
        "answer": "A genuine employer does not ask you to pay to be hired. Requests for payment for training, equipment, processing, or a visa before you start are a strong sign of a scam, and in the Philippines charging applicants these fees is not allowed."
      },
      {
        "question": "How do I check that a job offer is genuine before I reply?",
        "answer": "Do not use the phone number or link in the message. Search for the company yourself, open their official careers page to see if the role is posted, and call their main line to ask HR whether the position and the recruiter are real."
      }
    ],
    "relatedSlugs": ["data-harvesting", "whatsapp-telegram-task"]
  },
  {
    "slug": "data-harvesting",
    "name": "Fake-onboarding data-harvesting scams",
    "aka": [
      "Fake HR portal scam",
      "Onboarding document harvesting scam",
      "New-hire paperwork identity theft",
      "Fake recruitment portal login scam",
      "Payroll setup identity scam"
    ],
    "searchTitle": "Is this onboarding form asking for my ID a scam?",
    "metaDescription": "A fake onboarding or HR portal collects your ID, passport, selfie, or bank details for identity theft, not a real job. Spot the red flags and act fast.",
    "summary": "A fake \"onboarding\" process or HR portal poses as your new employer to collect your ID, passport, bank details, or a photo of your face. There is no real job; the goal is to steal your identity and use your documents for fraud.",
    "howItWorks": [
      "You receive a job offer quickly, often after only a short chat interview or none at all, and are told to start onboarding right away.",
      "They send you to a professional-looking HR or onboarding portal, or email you official-seeming new-hire forms.",
      "The forms ask for your ID or passport, a selfie holding your ID, your bank account, and your tax or national ID number, framed as payroll setup or identity verification.",
      "You upload everything, and the job then stalls, goes silent, or keeps demanding more documents.",
      "Your details are used to open accounts, take out loans, or impersonate you, or they are sold to other criminals."
    ],
    "redFlags": [
      "You are asked for your ID, passport, or bank details before any real interview or signed contract.",
      "You are told to send a selfie holding your ID next to your face for \"verification\".",
      "The portal link uses a free email domain or a web address that is slightly misspelled or off-brand.",
      "They pressure you to finish the paperwork today to secure the offer.",
      "No one will answer basic questions about the role, pay, or the company before you hand over documents.",
      "You cannot confirm the company or recruiter through the firm's official website or a direct phone call."
    ],
    "whatToDo": [
      "Stop now and do not upload any more documents or complete another onboarding form.",
      "Verify the employer yourself by finding the company's official number and calling to confirm the job and the recruiter exist.",
      "If you sent bank details, contact your bank or e-wallet to flag possible identity fraud and watch closely for activity you did not make.",
      "Save all evidence, including the offer, the portal link, emails, and chat messages, before the scammer can delete it.",
      "Report it to your local authorities; in the Philippines, contact the PNP Anti-Cybercrime Group or NBI Cybercrime Division, and the National Privacy Commission for misused personal data."
    ],
    "faq": [
      {
        "question": "Is it normal to give my ID and bank details during onboarding?",
        "answer": "Real employers do collect these, but only after a genuine interview and a signed offer, never as the very first step from a stranger. A legitimate employer can explain exactly why each document is needed and will wait for the proper stage."
      },
      {
        "question": "I already sent my ID and a selfie. What can they do with it?",
        "answer": "They can use it to open bank accounts, apply for loans or credit, pass identity checks in your name, or sell your documents to others. Treat everything you sent as compromised and monitor your accounts and any credit activity closely."
      },
      {
        "question": "How do I know if the HR portal is fake?",
        "answer": "Check the web address carefully for misspellings or free email domains, and confirm the link actually came from an official company address. When in doubt, ignore the link and log in only through the company's real website that you find yourself."
      },
      {
        "question": "They only asked for documents, not money. Is it still a scam?",
        "answer": "Yes. Harvesting your identity is the goal itself, and many of these scams never ask for money because your ID, face, and bank details are what the criminals are after."
      },
      {
        "question": "Can I undo the damage after sending my documents?",
        "answer": "You cannot un-send a file, but you can limit the harm by flagging your bank, reporting to the authorities, and staying alert for accounts or loans opened in your name. Acting quickly makes fraud in your name harder to pull off."
      }
    ],
    "relatedSlugs": ["fake-recruiter", "reshipping-money-mule"]
  },
  {
    "slug": "equipment-kit",
    "name": "Equipment-kit & pay-to-train scams",
    "aka": [
      "Pay-to-train scam",
      "Equipment-kit scam",
      "Mandatory training fee scam",
      "Starter kit job scam",
      "Certification fee scam"
    ],
    "searchTitle": "Should a real job make me pay for equipment?",
    "metaDescription": "A legit employer never makes you buy an equipment kit, software, or paid training before you start. Learn the red flags and how to protect your money.",
    "summary": "In an equipment-kit or pay-to-train scam, a fake \"employer\" tells you the job is yours but you must first buy a mandatory equipment kit, software license, or paid training or certification from them. The job does not exist; the goal is to take your payment.",
    "howItWorks": [
      "You are offered the job quickly, often after little or no real interview, and told you are already hired.",
      "The 'employer' says you must buy a required equipment kit, software license, or paid training before your start date.",
      "They send you a specific amount to pay and a payment method they control, such as a bank transfer, gift cards, or a crypto wallet.",
      "They add pressure by saying the slot, price, or start date expires soon if you do not pay today.",
      "Once you send the money, the equipment never arrives, the 'training' is worthless, and the contact disappears or keeps inventing new fees."
    ],
    "redFlags": [
      "You are asked to pay for equipment, software, training, or a certification before you have earned any wages.",
      "You must buy the kit only from the employer or their named supplier, not from a normal shop of your choice.",
      "Payment is demanded by gift cards, crypto, e-wallets, or personal bank transfer instead of a normal payroll process.",
      "You are pushed to pay immediately or lose the job, leaving no time to check the company.",
      "The 'refund' for the kit is promised in your first paycheck, but the paycheck depends on you paying first.",
      "The company has no verifiable address, official email domain, or real presence you can confirm."
    ],
    "whatToDo": [
      "Stop and pay nothing; a genuine employer covers or provides work equipment and never charges you to start.",
      "Do not send gift cards, crypto, or bank transfers, and do not share card or account numbers to 'reserve' the job.",
      "Independently verify the company through its official website and public contact details you find yourself, not the ones they gave you.",
      "Report the offer to your local authorities and to the platform where you found the listing.",
      "If you already paid, contact your bank or payment provider immediately to try to stop or reverse the transaction."
    ],
    "faq": [
      {
        "question": "Do real employers ever ask new hires to pay for equipment?",
        "answer": "No. A legitimate employer provides the tools you need or reimburses approved costs through payroll; they do not require you to pay them before you start."
      },
      {
        "question": "They promised to refund the kit in my first paycheck. Is that safe?",
        "answer": "No. That promise only exists to get you to pay now, and the paycheck it depends on will not come. The refund is bait, not a guarantee."
      },
      {
        "question": "The training and certification sound professional. Could it be real?",
        "answer": "Professional wording does not make it real. If a job requires you to pay the 'employer' for training or certification before day one, treat it as a scam."
      },
      {
        "question": "I already paid for the kit. What can I do now?",
        "answer": "Contact your bank or payment provider right away to try to reverse the payment, stop any further payments, save all messages and receipts, and report it to your local authorities."
      },
      {
        "question": "How can I tell a genuine equipment need from a scam?",
        "answer": "A genuine role lets you use your own or company-provided equipment and never forces you to buy a specific kit from the employer as a condition of being hired."
      }
    ],
    "relatedSlugs": ["upfront-fee", "crypto-deposit"]
  }
]

const BY_SLUG = new Map(SCAM_PATTERNS.map((p) => [p.slug, p]))

/**
 * @param {string} slug
 * @returns {ScamPattern | undefined}
 */
export function getScamPattern(slug) {
  return BY_SLUG.get(slug)
}

/** @returns {string[]} */
export function scamPatternSlugs() {
  return SCAM_PATTERNS.map((p) => p.slug)
}
