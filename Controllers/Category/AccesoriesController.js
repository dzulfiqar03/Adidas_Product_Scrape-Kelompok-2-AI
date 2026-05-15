
class AccesoriesController {
    getChatbotPage(userQuery, searchKey, aksesorisDocs) {
        if (aksesorisDocs.length > 0) {
            // Logika Filter Tas/Bag
            const isSearchingBag = userQuery.toLowerCase().includes("tas") || userQuery.toLowerCase().includes("bag");
            const isSearchingHat = userQuery.toLowerCase().includes("cap") || userQuery.toLowerCase().includes("hat") || userQuery.toLowerCase().includes("topi");
            const isMurah = userQuery.toLowerCase().includes("murah") || userQuery.toLowerCase().includes("dibawah") || userQuery.toLowerCase().includes("kurang dari") || userQuery.toLowerCase().includes("termurah");
            const isMahal = userQuery.toLowerCase().includes("mahal") || userQuery.toLowerCase().includes("diatas") || userQuery.toLowerCase().includes("lebih dari") || userQuery.toLowerCase().includes("termahal");
            const isRekomendasi = userQuery.toLowerCase().includes("terbaik") || userQuery.toLowerCase().includes("rekomendasi");
            const isLaris = userQuery.toLowerCase().includes("terlaris") || userQuery.toLowerCase().includes("laris") || userQuery.toLowerCase().includes("paling laris");
            const isRateTinggi = userQuery.toLowerCase().includes("rating tertinggi") || userQuery.toLowerCase().includes("tinggi");
            const isRateRendah = userQuery.toLowerCase().includes("rating terendah") || userQuery.toLowerCase().includes("rendah");

            if (isSearchingBag) {
                searchKey = 'bag'
            } else if (isSearchingHat) {
                searchKey = 'hat'
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

            const listAksesoris = aksesorisDocs
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
                    if (searchKey === 'bag') {
                        return item.nama.toLowerCase().includes('bag') || item.nama.toLowerCase().includes('tas');
                    }

                    else if (searchKey === 'hat') {
                        return item.nama.toLowerCase().includes('hat') || item.nama.toLowerCase().includes('cap');
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
                        return `${idx + 1}. ${item.nama} - ${formatHarga}, Rating ⭐ ${item.rate.toFixed(1)} || Terjual ${item.laris} item`

                    } else if (searchKey === 'laris') {
                        return `${idx + 1}. ${item.nama} - ${formatHarga} || Terjual ${item.laris} item`

                    } else if (searchKey === 'rateTinggi' || searchKey === 'rateRendah') {
                        return `${idx + 1}. ${item.nama} - ${formatHarga} ||  Rating ⭐ ${item.rate.toFixed(1)}`

                    } else {
                        return `${idx + 1}. ${item.nama} - ${formatHarga}`

                    }
                })
                .slice(0, 15)
                .join('\n');

            if (listAksesoris) {
                if (searchKey === 'murah') {
                    return `Berikut daftar koleksi aksesoris termurah kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'mahal') {
                    return `Berikut daftar koleksi aksesoris termahal kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rekomendasi') {
                    return `Berikut rekomendasi aksesoris kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;
                }
                else if (searchKey === 'laris') {
                    return `Berikut aksesoris kami yang terlaris:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                }
                else if (searchKey === 'rateTinggi') {
                    return `Berikut aksesoris kami yang memiliki rating tertinggi:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rateRendah') {
                    return `Berikut aksesoris kami yang memiliki rating terendah:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;

                }
                return `Berikut daftar koleksi aksesoris kami:\n\n${listAksesoris}\n\nMau detail yang mana, Kak?`;
            }
        }
        else {
            return `Maaf belum ada data mengenai Produk Aksesoris`
        }

    }
}

module.exports = AccesoriesController