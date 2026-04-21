/**
 * @fileOverview Universal Tribal Dictionary.
 * Defines high-fidelity translation strings for the Ummy frequency.
 */

export type LanguageCode = 'en' | 'hi' | 'bn' | 'ar' | 'ur';

export const TRANSLATIONS: Record<LanguageCode, any> = {
 en: {
  nav: { home: 'Home', discover: 'Discover', message: 'Message', me: 'Me', boutique: 'Boutique', rankings: 'Rankings', games: 'Game Zone', signout: 'Sign Out' },
  home: { recommend: 'Recommend', mine: 'Me', categories: { all: 'All', chat: 'Chat', game: 'Game', music: 'Music', newcomers: 'Newcomers', party: 'Party' }, topRooms: 'Top Rooms Grid', launch: 'Launch Frequency', noActive: 'No Active Frequencies' },
  profile: { fans: 'Fans', following: 'Following', friends: 'Friend', visitors: 'Visitors', coins: 'Coins', diamonds: 'Diamonds', level: 'Level', store: 'Store', budget: 'Budget', task: 'Task', vip: 'Vip Premium™', secretCard: 'Secret card get rewards', invite: 'Invite friends', bag: 'Bag', inventory: 'Inventory', cp: 'Cp/friends', help: 'Help center', about: 'About', settings: 'Settings', id: 'ID', follow: 'Follow', chat: 'Chat' },
  messages: { title: 'Message', team: 'Ummy Team', system: 'Ummy System', conversations: 'Conversations', quiet: 'Quiet Frequency', startVibe: 'Start a vibe with your tribe.' },
  settings: { title: 'Settings', identity: 'TRIBAL IDENTITY', language: 'LANGUAGE', logout: 'EXIT FREQUENCY (SIGN OUT)', delete: 'DELETE ACCOUNT', footer: 'Ummy Secure Protocol v1.4.2 • India Official', langSelect: 'Select Language' },
  wallet: { title: 'Wallet', coins: 'Coins', diamonds: 'Diamonds', record: 'Record', recharge: 'Recharge Now', withdrawal: 'Withdrawal', exchange: 'Exchange diamonds to coins' }
 },
 hi: {
  nav: { home: 'होम', discover: 'खोजें', message: 'संदेश', me: 'प्रोफ़ाइल', boutique: 'बुटीक', rankings: 'रैंकिंग', games: 'गेम ज़ोन', signout: 'साइन आउट' },
  home: { recommend: 'अनुशंसित', mine: 'मेरी', categories: { all: 'सभी', chat: 'चैट', game: 'गेम', music: 'म्यूजिक', newcomers: 'नवागंतुक', party: 'पार्टी' }, topRooms: 'टॉप रूम ग्रिड', launch: 'फ्रीक्वेंसी शुरू करें', noActive: 'कोई सक्रिय फ्रीक्वेंसी नहीं' },
  profile: { fans: 'प्रशंसक', following: 'अनुसरण', friends: 'मित्र', visitors: 'विज़िटर', coins: 'सिक्के', diamonds: 'हीरे', level: 'लेवल', store: 'स्टोर', budget: 'बजट', task: 'कार्य', vip: 'वीआईपी प्रीमियम™', secretCard: 'गुप्त कार्ड इनाम पाएं', invite: 'दोस्तों को आमंत्रित करें', bag: 'बैग', inventory: 'इन्वेंट्री', cp: 'जोड़ी/दोस्त', help: 'सहायता केंद्र', about: 'बारे में', settings: 'सेटिंग', id: 'आईडी', follow: 'फॉलो करें', chat: 'चैट' },
  messages: { title: 'संदेश', team: 'उम्मी टीम', system: 'उम्मी सिस्टम', conversations: 'बातचीत', quiet: 'शांत फ्रीक्वेंसी', startVibe: 'अपने कबीले के साथ वाइब शुरू करें।' },
  settings: { title: 'सेटिंग्स', identity: 'जनजातीय पहचान', language: 'भाषा', logout: 'फ्रीक्वेंसी से बाहर निकलें (साइन आउट)', delete: 'खाता हटाएं', footer: 'उम्मी सुरक्षित प्रोटोकॉल v1.4.2 • भारत आधिकारिक', langSelect: 'भाषा चुनें' },
  wallet: { title: 'वॉलेट', coins: 'सिक्के', diamonds: 'हीरे', record: 'रिकॉर्ड', recharge: 'अभी रिचार्ज करें', withdrawal: 'निकासी', exchange: 'हीरे को सिक्कों में बदलें' }
 },
 bn: {
  nav: { home: 'হোম', discover: 'আবিষ্কার', message: 'বার্তা', me: 'প্রোফাইল', boutique: 'বুটিক', rankings: 'র‍্যাঙ্কিং', games: 'গেম জোন', signout: 'সাইন আউট' },
  home: { recommend: 'প্রস্তাবিত', mine: 'আমার', categories: { all: 'সব', chat: 'চ্যাট', game: 'গেম', music: 'মিউজিক', newcomers: 'নতুন', party: 'পার্টি' }, topRooms: 'টপ রুম গ্রিড', launch: 'ফ্রিকোয়েন্সি শুরু করুন', noActive: 'কোনো সক্রিয় ফ্রিকোয়েন্সি নেই' },
  profile: { fans: 'ফ্যান', following: 'অনুসরণ', friends: 'বন্ধু', visitors: 'দর্শক', coins: 'কয়েন', diamonds: 'ডায়মন্ড', level: 'লেভেল', store: 'স্টোর', budget: 'বাজেট', task: 'টাস্ক', vip: 'ভিআইপি প্রিমিয়াম™', secretCard: 'সিক্রেট কার্ড রিওয়ার্ড পান', invite: 'বন্ধুদের আমন্ত্রণ জানান', bag: 'ব্যাগ', inventory: 'ইনভেন্টরি', cp: 'জুটি/বন্ধু', help: 'সহায়তা কেন্দ্র', about: 'সম্পর্কে', settings: 'সেটিং', id: 'আইডি', follow: 'ফলো', chat: 'চ্যাট' },
  messages: { title: 'বার্তা', team: 'উম্মি টিম', system: 'উম্মি সিস্টেম', conversations: 'আলাপচারিতা', quiet: 'শান্ত ফ্রিকোয়েন্সি', startVibe: 'আপনার দলের সাথে ভাইব শুরু করুন।' },
  settings: { title: 'সেটিংস', identity: 'উপজাতীয় পরিচয়', language: 'ভাষা', logout: 'ফ্রিকোয়েন্সি প্রস্থান করুন (সাইন আউট)', delete: 'অ্যাকাউন্ট মুছুন', footer: 'উম্মি সুরক্ষিত প্রোটোকল v1.4.2 • ভারত অফিসিয়াল', langSelect: 'ভাষা নির্বাচন করুন' },
  wallet: { title: 'ওয়ালেট', coins: 'কয়েন', diamonds: 'ডায়মন্ড', record: 'রেকর্ড', recharge: 'এখন রিচার্জ করুন', withdrawal: 'উত্তোলন', exchange: 'ডায়মন্ড কয়েনে রূপান্তর করুন' }
 },
 ar: {
  nav: { home: 'الرئيسية', discover: 'اكتشف', message: 'الرسائل', me: 'أنا', boutique: 'بوتيك', rankings: 'التصنيفات', games: 'منطقة الألعاب', signout: 'تسجيل الخروج' },
  home: { recommend: 'موصى به', mine: 'غرفتي', categories: { all: 'الكل', chat: 'دردشة', game: 'ألعاب', music: 'موسيقى', newcomers: 'القادمون الجدد', party: 'حفلة' }, topRooms: 'أعلى الغرف', launch: 'بدء التردد', noActive: 'لا يوجد ترددات نشطة' },
  profile: { fans: 'المعجبون', following: 'متابعة', friends: 'صديق', visitors: 'الزوار', coins: 'عملات', diamonds: 'ماس', level: 'المستوى', store: 'المتجر', budget: 'الميزانية', task: 'المهمة', vip: 'كبار الشخصيات™', secretCard: 'بطاقة سرية للحصول على مكافآت', invite: 'دعوة الأصدقاء', bag: 'الحقيبة', inventory: 'المخزون', cp: 'شريك/أصدقاء', help: 'مركز المساعدة', about: 'حول', settings: 'الإعدادات', id: 'المعرف', follow: 'متابعة', chat: 'دردشة' },
  messages: { title: 'الرسائل', team: 'فريق أومي', system: 'نظام أومي', conversations: 'المحادثات', quiet: 'تردد هادئ', startVibe: 'ابدأ الأجواء مع قبيلتك.' },
  settings: { title: 'الإعدادات', identity: 'الهوية القبلية', language: 'اللغة', logout: 'الخروج من التردد', delete: 'حذف الحساب', footer: 'بروتوكول أومي الآمن v1.4.2 • الهند الرسمية', langSelect: 'اختر اللغة' },
  wallet: { title: 'المحفظة', coins: 'العملات', diamonds: 'الماس', record: 'سجل', recharge: 'شحن الآن', withdrawal: 'سحب', exchange: 'تحويل الماس إلى عملات' }
 },
 ur: {
  nav: { home: 'ہوم', discover: 'دریافت', message: 'پیغام', me: 'میں', boutique: 'بوٹیک', rankings: 'درجہ بندی', games: 'گیم زون', signout: 'سائن آؤٹ' },
  home: { recommend: 'تجویز کردہ', mine: 'میری', categories: { all: 'تمام', chat: 'چیٹ', game: 'گیمز', music: 'موسیقی', newcomers: 'نئے آنے والے', party: 'پارٹی' }, topRooms: 'ٹاپ رومز', launch: 'فریکوئنسی شروع کریں', noActive: 'کوئی فعال فریکوئنسی نہیں' },
  profile: { fans: 'مداح', following: 'فالوئنگ', friends: 'دوست', visitors: 'وزیٹرز', coins: 'سکے', diamonds: 'ڈائمنڈز', level: 'لیول', store: 'اسٹور', budget: 'بجٹ', task: 'ٹاسک', vip: 'وی آئی پی پریمیم™', secretCard: 'انعام حاصل کریں', invite: 'دوستوں کو مدعو کریں', bag: 'بیگ', inventory: 'انوینٹری', cp: 'جوڑی/دوست', help: 'مدد مرکز', about: 'متعلق', settings: 'ترتیبات', id: 'آئی ڈی', follow: 'فالو کریں', chat: 'چیٹ' },
  messages: { title: 'پیغامات', team: 'امی ٹیم', system: 'امی سسٹم', conversations: 'بات چیت', quiet: 'خاموش فریکوئنسی', startVibe: 'اپنے قبیلے کے ساتھ وائب شروع کریں۔' },
  settings: { title: 'ترتیبات', identity: 'قبائلی شناخت', language: 'زبان', logout: 'فریکوئنسی سے باہر نکلیں', delete: 'اکاؤنٹ حذف کریں', footer: 'امی محفوظ پروٹوکول v1.4.2 • انڈیا آفیشل', langSelect: 'زبان منتخب کریں' },
  wallet: { title: 'والٹ', coins: 'سکے', diamonds: 'ڈائمنڈز', record: 'ریکارڈ', recharge: 'ابھی ریچارج کریں', withdrawal: 'نکالنا', exchange: 'ڈائمنڈز کو سکوں میں بدلیں' }
 }
};
