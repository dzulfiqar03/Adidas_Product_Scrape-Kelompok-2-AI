class TrainingController {

    getChatbotPage(userQuery, searchKey, trainingDocs) {

        if (trainingDocs.length > 0) {

            // =========================
            // DETEKSI KEYWORD
            // =========================

            const isSearchingShoes =
                userQuery.toLowerCase().includes("shoes") ||
                userQuery.toLowerCase().includes("sepatu");

            const isSearchingJacket =
                userQuery.toLowerCase().includes("jacket") ||
                userQuery.toLowerCase().includes("jaket");

            const isSearchingPants =
                userQuery.toLowerCase().includes("pants") ||
                userQuery.toLowerCase().includes("celana");

            const isMurah =
                userQuery.toLowerCase().includes("murah") ||
                userQuery.toLowerCase().includes("termurah");

            const isMahal =
                userQuery.toLowerCase().includes("mahal") ||
                userQuery.toLowerCase().includes("termahal");

            const isRekomendasi =
                userQuery.toLowerCase().includes("rekomendasi") ||
                userQuery.toLowerCase().includes("terbaik");

            const isLaris =
                userQuery.toLowerCase().includes("laris") ||
                userQuery.toLowerCase().includes("terlaris");

            const isRateTinggi =
                userQuery.toLowerCase().includes("rating tinggi") ||
                userQuery.toLowerCase().includes("rating tertinggi");

            const isRateRendah =
                userQuery.toLowerCase().includes("rating rendah") ||
                userQuery.toLowerCase().includes("rating terendah");


            // =========================
            // SEARCH KEY
            // =========================

            if (isSearchingShoes) {
                searchKey = 'shoes';

            } else if (isSearchingJacket) {
                searchKey = 'jacket';

            } else if (isSearchingPants) {
                searchKey = 'pants';

            } else if (isMurah) {
                searchKey = 'murah';

            } else if (isMahal) {
                searchKey = 'mahal';

            } else if (isRekomendasi) {
                searchKey = 'rekomendasi';

            } else if (isLaris) {
                searchKey = 'laris';

            } else if (isRateTinggi) {
                searchKey = 'rateTinggi';

            } else if (isRateRendah) {
                searchKey = 'rateRendah';
            }


            // =========================
            // FORMAT DATA
            // =========================

            const listTraining = trainingDocs

                .map(doc => {

                    const nama = doc.nama || "";

                    const harga = parseInt(
                        String(doc.harga).replace(/[^0-9]/g, "")
                    ) || 0;

                    const rate = parseFloat(
                        doc["inline-block"]
                    ) || 0;

                    const larisText =
                        doc["truncate 2"] ||
                        doc["truncate"] ||
                        "";

                    const laris = parseInt(
                        String(larisText).replace(/[^0-9]/g, "")
                    ) || 0;

                    return {
                        nama,
                        harga,
                        rate,
                        laris
                    };
                })


                // =========================
                // FILTER
                // =========================

                .filter(item => {

                    if (searchKey === 'shoes') {
                        return item.nama.toLowerCase().includes('shoes') ||
                            item.nama.toLowerCase().includes('sepatu');
                    }

                    else if (searchKey === 'jacket') {
                        return item.nama.toLowerCase().includes('jacket') ||
                            item.nama.toLowerCase().includes('jaket');
                    }

                    else if (searchKey === 'pants') {
                        return item.nama.toLowerCase().includes('pants') ||
                            item.nama.toLowerCase().includes('celana');
                    }

                    return true;
                })


                // =========================
                // SORTING
                // =========================

                .sort((a, b) => {

                    if (searchKey === 'murah') {
                        return a.harga - b.harga;
                    }

                    else if (searchKey === 'mahal') {
                        return b.harga - a.harga;
                    }

                    else if (searchKey === 'rekomendasi') {

                        if (b.rate !== a.rate) {
                            return b.rate - a.rate;
                        }

                        if (b.laris !== a.laris) {
                            return b.laris - a.laris;
                        }

                        return a.harga - b.harga;
                    }

                    else if (searchKey === 'laris') {
                        return b.laris - a.laris;
                    }

                    else if (searchKey === 'rateTinggi') {
                        return b.rate - a.rate;
                    }

                    else if (searchKey === 'rateRendah') {
                        return a.rate - b.rate;
                    }

                    return 0;
                })


                // =========================
                // OUTPUT
                // =========================

                .map((item, idx) => {

                    const formatHarga = new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(item.harga);

                    if (searchKey === 'rekomendasi') {

                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Rating ⭐ ${item.rate.toFixed(1)} | Terjual: ${item.laris}`;

                    }

                    else if (searchKey === 'laris') {

                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Terjual: ${item.laris}`;

                    }

                    else if (searchKey === 'rateTinggi' || searchKey === 'rateRendah') {

                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Rating ⭐ ${item.rate.toFixed(1)}`;

                    }

                    else {

                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga}`;
                    }
                })

                .join('\n\n');


            // =========================
            // RESPONSE CHATBOT
            // =========================

            if (listTraining) {

                if (searchKey === 'murah') {

                    return `Berikut daftar produk training termurah kami:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (searchKey === 'mahal') {

                    return `Berikut daftar produk training termahal kami:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (searchKey === 'rekomendasi') {

                    return `Berikut rekomendasi produk training terbaik:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (searchKey === 'laris') {

                    return `Berikut produk training terlaris:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (searchKey === 'rateTinggi') {

                    return `Berikut produk training dengan rating tertinggi:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (searchKey === 'rateRendah') {

                    return `Berikut produk training dengan rating terendah:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;

                }

                else if (
                    searchKey === 'shoes' ||
                    searchKey === 'jacket' ||
                    searchKey === 'pants'
                ) {

                    return `Berikut koleksi training Adidas untuk kategori tersebut:\n\n${listTraining}\n\nMau detail yang mana, Kak?`;
                }


                return `Menu Training Adidas:
1. *shoes* - lihat koleksi sepatu training
2. *jacket* - lihat koleksi jacket training
3. *pants* - lihat koleksi celana training
4. *murah* - produk training termurah
5. *mahal* - produk training premium
6. *laris* - produk paling laku
7. *rating tinggi* - rekomendasi terbaik
8. *checkout* - cara order

Yuk balas dengan kata kunci di atas 😊`;
            }

        }

        else {

            return `Maaf belum ada data mengenai produk Training`;
        }

    }

}

module.exports = TrainingController;