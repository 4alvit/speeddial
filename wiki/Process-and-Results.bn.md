# উৎস, স্থাপন ও যাচাই

<!-- language-navigation:start -->
<p dir="ltr">
<a href="Process-and-Results.md" lang="en" dir="ltr">English</a>
<a href="Process-and-Results.ar.md" lang="ar" dir="rtl">العربية</a>
<a href="Process-and-Results.bn.md" lang="bn" dir="ltr">বাংলা</a>
<a href="Process-and-Results.cs.md" lang="cs" dir="ltr">Čeština</a>
<a href="Process-and-Results.de.md" lang="de" dir="ltr">Deutsch</a>
<a href="Process-and-Results.es.md" lang="es" dir="ltr">Español</a>
<a href="Process-and-Results.fa.md" lang="fa" dir="rtl">فارسی</a>
<a href="Process-and-Results.fr.md" lang="fr" dir="ltr">Français</a>
<a href="Process-and-Results.he.md" lang="he" dir="rtl">עברית</a>
<a href="Process-and-Results.hi.md" lang="hi" dir="ltr">हिन्दी</a>
<a href="Process-and-Results.id.md" lang="id" dir="ltr">Bahasa Indonesia</a>
<a href="Process-and-Results.it.md" lang="it" dir="ltr">Italiano</a>
<a href="Process-and-Results.ja.md" lang="ja" dir="ltr">日本語</a>
<a href="Process-and-Results.ko.md" lang="ko" dir="ltr">한국어</a>
<a href="Process-and-Results.nl.md" lang="nl" dir="ltr">Nederlands</a>
<a href="Process-and-Results.pl.md" lang="pl" dir="ltr">Polski</a>
<a href="Process-and-Results.pt.md" lang="pt" dir="ltr">Português</a>
<a href="Process-and-Results.ru.md" lang="ru" dir="ltr">Русский</a>
<a href="Process-and-Results.th.md" lang="th" dir="ltr">ไทย</a>
<a href="Process-and-Results.tr.md" lang="tr" dir="ltr">Türkçe</a>
<a href="Process-and-Results.uk.md" lang="uk" dir="ltr">Українська</a>
<a href="Process-and-Results.vi.md" lang="vi" dir="ltr">Tiếng Việt</a>
<a href="Process-and-Results.zh-Hans.md" lang="zh-Hans" dir="ltr">简体中文</a>
<a href="Process-and-Results.zh-Hant.md" lang="zh-Hant" dir="ltr">繁體中文</a>
</p>
<!-- language-navigation:end -->

[উইকির মূল পাতা](Home.md)

পাবলিক `speeddial` রিপোজিটরিতে অ্যাপের দুই সংস্করণ, পরীক্ষা, সাধারণ স্থাপনের উদাহরণ ও নথি রয়েছে। এটি নতুন Git ইতিহাস ও কৃত্রিম পরীক্ষার ডেটা দিয়ে শুরু হয়। ব্যক্তিগত পরিচালনা আর্কাইভে ঐতিহাসিক উপকরণ ও স্থাপন পুনরুদ্ধারের রেকর্ড থাকে; অ্যাপের কোড নকল না করে নির্দিষ্ট পাবলিক সোর্স রিভিশন বা অপরিবর্তনীয় ইমেজ ব্যবহার করা হয়।

[ব্রাউজারের স্থানীয় অ্যাপ](https://speeddial.alvit.here.now/) প্রতিটি দর্শনার্থীর জন্য ফাঁকা বোর্ড দিয়ে শুরু হয়। কোড প্রকাশ করলে কারও লিংক বা স্ক্রিনশট অন্য ব্রাউজারে কপি হয় না। [ব্যাকআপ স্ক্রিপ্ট](../docs/browser-backups.bn.md) গন্তব্যের উদ্ধার কপি এবং পুনরুদ্ধারের পরে বিষয়বস্তুর হুবহু তুলনাসহ সচেতনভাবে স্থানান্তর করতে সাহায্য করে।

## স্থাপনের প্রক্রিয়া

![উৎস যাচাই, বিচ্ছিন্ন পুনরুদ্ধার মহড়া, স্থাপন ও গ্রহণযোগ্যতা যাচাই আলাদা ধাপ।](images/release-process.svg)

সার্ভার সংস্করণে Node.js, Docker ও k3s সমর্থিত থাকে। পাবলিক রিভিশন নির্দিষ্ট করুন, যাচাইকৃত অপরিবর্তনীয় ইমেজ তৈরি বা নির্বাচন করুন এবং এই রিপোজিটরির বাইরে ব্যক্তিগত কনফিগারেশন প্রয়োগ করুন। পরিচয়পত্র ও স্থায়ী ডেটা ভলিউম অ্যাপের ইমেজ থেকে আলাদা রাখুন। বিদ্যমান ইনস্টলেশন স্থানান্তরের জন্য [পরিবর্তন ও রোলব্যাক নির্দেশিকা](../deploy/README.md) ব্যবহার করুন।

## রিপোজিটরি ও ডেটার সীমানা

![পাবলিক অ্যাপের সোর্স ব্যক্তিগত স্থাপনকে সরবরাহ করে; ব্যক্তিগত ব্রাউজার ডেটা ও সার্ভার পুনরুদ্ধারের রেকর্ড ব্যক্তিগতই থাকে।](images/release-results.svg)

পাবলিক সোর্সে ব্যক্তিগত প্রাথমিক বোর্ড নেই। ব্রাউজারের স্থানীয় ব্যাকআপ Git-এ উপেক্ষিত `backups/`-এ থাকে; সার্ভারের পুনরুদ্ধার সেটে SQLite, উল্লেখ করা ছবির ফাইল ও আলাদাভাবে সুরক্ষিত পরিচয়পত্র থাকে। বিন্যাসগুলো আলাদা সংস্করণের জন্য এবং একটির বদলে অন্যটি ব্যবহারযোগ্য নয়।

## যাচাই

স্থানীয় ও CI পরীক্ষা কৃত্রিম পরীক্ষার ডেটা এবং তাদের চালানো পরিস্থিতি যাচাই করে। দুই সংস্করণেই পাঁচটি ভাষা, গুটিয়ে রাখা নিয়ন্ত্রণ, জোড়ায় অদলবদল, পয়েন্টার অনুসরণকারী প্রিভিউ, গ্রিডের মাত্রা এবং স্বাভাবিকভাবে একই উইন্ডোতে নেভিগেশন বজায় থাকে।

সার্ভার স্থানান্তরের মহড়া ID, ক্রম, শিরোনাম, URL, সেটিংস, ছবির রেফারেন্স এবং SQLite-এর অখণ্ডতা তুলনা করে। পরিচয়পত্র বদলের পরীক্ষা যাচাই করে যে পুনরায় চালুর পরে পুরোনো সেশন ব্যর্থ হয়। প্রকৃত স্থাপনের গ্রহণযোগ্যতা যাচাই লক্ষ্য পরিবেশে কাঙ্ক্ষিত রাউটিং, পরিচয়পত্র, ছবির প্রাপ্যতা ও ডেটা সংরক্ষণও পরীক্ষা করে।

সোর্সের পরীক্ষা সফল হলেই স্থাপন বা পুনরুদ্ধার ঘটেছে বলে প্রমাণ হয় না। প্রকৃত স্থাপনের রসিদ ও ব্যক্তিগত তালিকা ব্যক্তিগত রাখুন। চিত্রগুলো স্থাপত্য ও প্রক্রিয়া বোঝায়; কর্মদক্ষতা, প্রাপ্যতা বা পুনরুদ্ধারের সময়ের নিশ্চয়তা নয়। পাবলিক সোর্স `UNLICENSED`-ই থাকে।
