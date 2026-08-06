package app.vercel.ummy_chat.twa.data.model

data class Country(
    val name: String,
    val code: String,
    val flag: String,
    val id: String
)

val COUNTRIES_LIST = listOf(
    Country("India", "+91", "🇮🇳", "IN"),
    Country("Pakistan", "+92", "🇵🇰", "PK"),
    Country("Bangladesh", "+880", "🇧🇩", "BD"),
    Country("UAE", "+971", "🇦🇪", "AE"),
    Country("Saudi Arabia", "+966", "🇸🇦", "SA"),
    Country("USA", "+1", "🇺🇸", "US"),
    Country("UK", "+44", "🇬🇧", "GB"),
    Country("Canada", "+1", "🇨🇦", "CA"),
    Country("Turkey", "+90", "🇹🇷", "TR"),
    Country("Egypt", "+20", "🇪🇬", "EG"),
    Country("Jordan", "+962", "🇯🇴", "JO"),
    Country("Palestine", "+970", "🇵🇸", "PS"),
    Country("Bahrain", "+973", "🇧🇭", "BH"),
    Country("Kuwait", "+965", "🇰🇼", "KW"),
    Country("Oman", "+968", "🇴🇲", "OM"),
    Country("Qatar", "+974", "🇶🇦", "QA"),
    Country("Iraq", "+964", "🇮🇶", "IQ"),
    Country("Syria", "+963", "🇸🇾", "SY"),
    Country("Lebanon", "+961", "🇱🇧", "LB"),
    Country("Yemen", "+967", "🇾🇪", "YE"),
    Country("Algeria", "+213", "🇩🇿", "DZ"),
    Country("Morocco", "+212", "🇲🇦", "MA"),
    Country("Libya", "+218", "🇱🇾", "LY"),
    Country("Tunisia", "+216", "🇹🇳", "TN")
)
