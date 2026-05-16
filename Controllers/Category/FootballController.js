
class FootballController {
    getChatbotPage(userQuery, searchKey, footballDocs) {
        if (footballDocs.length > 0) {
            // Logika Filter Football
            const isSearchingJersey = userQuery.toLowerCase().includes("jersey") || userQuery.toLowerCase().includes("baju");
            const isSearchingShoes = userQuery.toLowerCase().includes("sepatu") || userQuery.toLowerCase().includes("boots");
            const isSearchingBall = userQuery.toLowerCase().includes("bola") || (userQuery.toLowerCase().includes("ball") && !userQuery.toLowerCase().includes("football"));
            const isMurah = userQuery.toLowerCase().includes("murah") || userQuery.toLowerCase().includes("dibawah") || userQuery.toLowerCase().includes("kurang dari") || userQuery.toLowerCase().includes("termurah");
            const isMahal = userQuery.toLowerCase().includes("mahal") || userQuery.toLowerCase().includes("diatas") || userQuery.toLowerCase().includes("lebih dari") || userQuery.toLowerCase().includes("termahal");
            const isRekomendasi = userQuery.toLowerCase().includes("terbaik") || userQuery.toLowerCase().includes("rekomendasi");
            const isLaris = userQuery.toLowerCase().includes("terlaris") || userQuery.toLowerCase().includes("laris") || userQuery.toLowerCase().includes("paling laris");
            const isRateTinggi = userQuery.toLowerCase().includes("rating tertinggi") || userQuery.toLowerCase().includes("tinggi");
            const isRateRendah = userQuery.toLowerCase().includes("rating terendah") || userQuery.toLowerCase().includes("rendah");

            if (isSearchingJersey) {
                searchKey = 'jersey'
            } else if (isSearchingShoes) {
                searchKey = 'shoes'
            } else if (isSearchingBall) {
                searchKey = 'ball'
            } else if (isMurah) {
                searchKey = 'murah'
            } else if (isMahal) {
                searchKey = 'mahal'
            } else if (isRekomendasi) {
                searchKey = 'rekomendasi'
            } else if (isLaris) {
                searchKey = 'laris'
            } else if (isRateTinggi) {
                searchKey = 'rateTinggi'
            } else if (isRateRendah) {
                searchKey = 'rateRendah'
            }

            const listFootball = footballDocs
                .map(doc => {
                    const rawText = doc.text.split('\n');

                    const titleProduct = rawText.find(l => l.includes('whitespace-normal:')) || "";
                    let nama = titleProduct.replace(/whitespace-normal:/gi, "").replace(/"/g, "").trim() || (rawText || "").replace(/whitespace-normal:/gi, "").replace(/"/g, "").trim();

                    const hargaLine = rawText.find(l => l.includes('font-medium 2:')) || "";

                    const hargaRaw = hargaLine.replace('font-medium 2:', '').replace(/[^0-9]/g, "");
                    const harga = parseInt(hargaRaw, 10) || 0;

                    const ratingLine = rawText.find(l => l.includes('inline-block:')) || "";
                    const rateRaw = ratingLine.replace('inline-block:', '').replace(/[^0-9.]/g, "").trim();
                    const rate = parseFloat(rateRaw) || 0;

                    const larisLin = rawText.find(l => l.includes('truncate:')) || "";
                    const larisRaw = larisLin.replace('truncate:', '').replace(/[^0-9]/g, "");
                    const laris = parseInt(larisRaw, 10) || 0;
                    return { nama, harga, rate, laris };
                })
                .filter(item => {
                    if (searchKey === 'jersey') {
                        return item.nama.toLowerCase().includes('jersey');
                    }
                    else if (searchKey === 'shoes') {
                        return item.nama.toLowerCase().includes('boots') || item.nama.toLowerCase().includes('sepatu') || item.nama.toLowerCase().includes('f50') || item.nama.toLowerCase().includes('predator');
                    }
                    else if (searchKey === 'ball') {
                        return item.nama.toLowerCase().includes('ball') || item.nama.toLowerCase().includes('bola');
                    }
                    return true; // Tampilkan semua jika cuma ketik "daftar produk"
                }).sort((a, b) => {
                    if (searchKey === 'murah') {
                        return a.harga - b.harga
                    } else if (searchKey === 'mahal') {
                        return b.harga - a.harga
                    } else if (searchKey === 'rekomendasi') {
                        if (b.rate !== a.rate) {
                            return b.rate - a.rate;
                        }
                        if (b.laris !== a.laris) {
                            return b.laris - a.laris;
                        }
                        return a.harga - b.harga
                    } else if (searchKey === 'laris') {
                        return b.laris - a.laris;
                    } else if (searchKey === 'rateTinggi') {
                        return b.rate - a.rate;
                    } else if (searchKey === 'rateRendah') {
                        return a.rate - b.rate;
                    }
                    return true
                })
                .map((item, idx) => {

                    const formatHarga = new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0
                    }).format(item.harga);

                    if (searchKey === 'rekomendasi') {
                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Rating ⭐ ${item.rate.toFixed(1)} | Terjual: ${item.laris}`;

                    } else if (searchKey === 'laris') {
                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Terjual: ${item.laris}`;

                    } else if (searchKey === 'rateTinggi' || searchKey === 'rateRendah') {
                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga} | Rating ⭐ ${item.rate.toFixed(1)}`;

                    } else {
                        return `*${idx + 1}. ${item.nama}*\n└ Harga: ${formatHarga}`;

                    }
                })
                .join('\n\n');

            if (listFootball) {
                if (searchKey === 'murah') {
                    return `Berikut daftar koleksi football termurah kami:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'mahal') {
                    return `Berikut daftar koleksi football termahal kami:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rekomendasi') {
                    return `Berikut rekomendasi perlengkapan football kami:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;
                }
                else if (searchKey === 'laris') {
                    return `Berikut perlengkapan football kami yang terlaris:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;

                }
                else if (searchKey === 'rateTinggi') {
                    return `Berikut perlengkapan football kami yang memiliki rating tertinggi:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rateRendah') {
                    return `Berikut perlengkapan football kami yang memiliki rating terendah:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'jersey' || searchKey === 'shoes' || searchKey === 'ball') {
                    return `Berikut perlengkapan football kami untuk kategori tersebut:\n\n${listFootball}\n\nMau detail yang mana, Kak?`;
                }
                
                return `Menu Football Adidas:
1. *jersey* - lihat koleksi jersey
2. *sepatu* - lihat koleksi sepatu bola
3. *bola* - lihat bola resmi
4. *murah* - rekomendasi produk termurah
5. *mahal* - lihat produk premium
6. *laris* - produk paling laku
7. *rating tinggi* - rekomendasi pelanggan
8. *checkout* - cara order

Yuk balas dengan kata kunci di atas untuk melihat daftarnya!`;
            }
        }
        else {
            return `Maaf belum ada data mengenai Produk Football`
        }

    }
}

module.exports = FootballController
