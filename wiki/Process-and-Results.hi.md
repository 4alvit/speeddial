# स्रोत, परिनियोजन और सत्यापन

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

[विकी मुखपृष्ठ](Home.md)

सार्वजनिक `speeddial` रिपॉज़िटरी में ऐप के दोनों संस्करण, परीक्षण, सामान्य परिनियोजन उदाहरण और दस्तावेज़ हैं। यह नए Git इतिहास और कृत्रिम परीक्षण डेटा से शुरू होती है। निजी संचालन अभिलेख पुराने विवरण और परिनियोजन पुनर्प्राप्ति रिकॉर्ड सुरक्षित रखते हैं और ऐप कोड की नकल किए बिना सार्वजनिक स्रोत के निश्चित संशोधन या अपरिवर्तनीय इमेज का उपयोग करते हैं।

[ब्राउज़र का स्थानीय ऐप](https://speeddial.alvit.here.now/) हर आगंतुक के लिए खाली बोर्ड से शुरू होता है। कोड प्रकाशित करने से किसी के लिंक या स्क्रीनशॉट दूसरे ब्राउज़र में कॉपी नहीं होते। [बैकअप स्क्रिप्ट](../docs/browser-backups.hi.md) गंतव्य की बचाव कॉपी और पुनर्स्थापन के बाद सामग्री की सटीक तुलना के साथ सोच-समझकर स्थानांतरण करने में मार्गदर्शन देती हैं।

## परिनियोजन प्रक्रिया

![स्रोत सत्यापन, अलग-थलग पुनर्स्थापन अभ्यास, परिनियोजन और स्वीकृति अलग चरण हैं।](images/release-process.svg)

सर्वर संस्करण के लिए Node.js, Docker और k3s समर्थित रहते हैं। सार्वजनिक संशोधन निश्चित करें, सत्यापित अपरिवर्तनीय इमेज बनाएँ या चुनें और निजी कॉन्फ़िगरेशन इस रिपॉज़िटरी के बाहर लागू करें। क्रेडेंशियल और स्थायी डेटा वॉल्यूम ऐप इमेज से अलग रखें। मौजूदा इंस्टॉलेशन के माइग्रेशन के लिए [कटओवर और रोलबैक मार्गदर्शिका](../deploy/README.md) का उपयोग करें।

## रिपॉज़िटरी और डेटा की सीमाएँ

![सार्वजनिक ऐप स्रोत निजी परिनियोजन को उपलब्ध होता है; व्यक्तिगत ब्राउज़र डेटा और सर्वर पुनर्प्राप्ति रिकॉर्ड निजी रहते हैं।](images/release-results.svg)

सार्वजनिक स्रोत में कोई व्यक्तिगत शुरुआती बोर्ड नहीं है। ब्राउज़र के स्थानीय बैकअप Git द्वारा अनदेखे `backups/` में रहते हैं; सर्वर पुनर्प्राप्ति सेट में SQLite, संदर्भित चित्र फ़ाइलें और अलग सुरक्षित क्रेडेंशियल होते हैं। ये प्रारूप अलग संस्करणों के लिए हैं और एक-दूसरे की जगह उपयोग नहीं हो सकते।

## सत्यापन

स्थानीय और CI जाँच कृत्रिम परीक्षण डेटा और अपने द्वारा चलाए गए परिदृश्यों को सत्यापित करती हैं। दोनों संस्करण पाँच भाषाएँ, संकुचित नियंत्रण, जोड़ीवार अदला-बदली, पॉइंटर का अनुसरण करने वाले पूर्वावलोकन, ग्रिड आकार और डिफ़ॉल्ट रूप से उसी विंडो में नेविगेशन बनाए रखते हैं।

सर्वर माइग्रेशन अभ्यास ID, क्रम, शीर्षक, URL, सेटिंग, चित्र संदर्भ और SQLite की अखंडता की तुलना करता है। क्रेडेंशियल रोटेशन जाँच पुष्टि करती है कि पुनः शुरू होने के बाद पुराने सत्र विफल होते हैं। वास्तविक परिनियोजन की स्वीकृति लक्ष्य वातावरण में इच्छित रूटिंग, क्रेडेंशियल, चित्र उपलब्धता और डेटा संरक्षण भी जाँचती है।

स्रोत की जाँच सफल होने से यह सिद्ध नहीं होता कि परिनियोजन या पुनर्स्थापन हुआ। वास्तविक परिनियोजन रसीदें और व्यक्तिगत सूचियाँ निजी रखें। आरेख संरचना और प्रक्रिया बताते हैं, प्रदर्शन, उपलब्धता या पुनर्प्राप्ति समय की गारंटी नहीं। सार्वजनिक स्रोत `UNLICENSED` ही रहता है।
