class PriaController {
    getChatbotPage(userQuery, searchKey, priaDocs) {
        if (priaDocs.length > 0) {
            const isSearchingBaju = userQuery.toLowerCase().includes("baju") || userQuery.toLowerCase().includes("kaos") || userQuery.toLowerCase().includes("t-shirt") || userQuery.toLowerCase().includes("tee");
            const isSearchingCelana = userQuery.toLowerCase().includes("celana") || userQuery.toLowerCase().includes("pants") || userQuery.toLowerCase().includes("shorts");
            const isSearchingJaket = userQuery.toLowerCase().includes("jaket") || userQuery.toLowerCase().includes("jacket") || userQuery.toLowerCase().includes("hoodie");
            
            const isMurah = userQuery.toLowerCase().includes("murah") || userQuery.toLowerCase().includes("dibawah") || userQuery.toLowerCase().includes("kurang dari") || userQuery.toLowerCase().includes("termurah");
            const isMahal = userQuery.toLowerCase().includes("mahal") || userQuery.toLowerCase().includes("diatas") || userQuery.toLowerCase().includes("lebih dari") || userQuery.toLowerCase().includes("termahal");
            const isRekomendasi = userQuery.toLowerCase().includes("terbaik") || userQuery.toLowerCase().includes("rekomendasi");
            const isLaris = userQuery.toLowerCase().includes("terlaris") || userQuery.toLowerCase().includes("laris") || userQuery.toLowerCase().includes("paling laris");
            const isRateTinggi = userQuery.toLowerCase().includes("rating tertinggi") || userQuery.toLowerCase().includes("tinggi");
            const isRateRendah = userQuery.toLowerCase().includes("rating terendah") || userQuery.toLowerCase().includes("rendah");

            if (isSearchingBaju) {
                searchKey = 'baju'
            } else if (isSearchingCelana) {
                searchKey = 'celana'
            } else if (isSearchingJaket) {
                searchKey = 'jaket'
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

            const listPria = priaDocs
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
                    if (searchKey === 'baju') {
                        return item.nama.toLowerCase().includes('baju') || item.nama.toLowerCase().includes('kaos') || item.nama.toLowerCase().includes('t-shirt') || item.nama.toLowerCase().includes('tee');
                    }
                    else if (searchKey === 'celana') {
                        return item.nama.toLowerCase().includes('celana') || item.nama.toLowerCase().includes('pants') || item.nama.toLowerCase().includes('shorts');
                    }
                    else if (searchKey === 'jaket') {
                        return item.nama.toLowerCase().includes('jaket') || item.nama.toLowerCase().includes('jacket') || item.nama.toLowerCase().includes('hoodie');
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

            if (listPria) {
                if (searchKey === 'murah') {
                    return `Berikut daftar koleksi pakaian pria termurah kami:\n\n${listPria}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'mahal') {
                    return `Berikut daftar koleksi pakaian pria termahal kami:\n\n${listPria}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rekomendasi') {
                    return `Berikut rekomendasi pakaian pria kami:\n\n${listPria}\n\nMau detail yang mana, Kak?`;
                }
                else if (searchKey === 'laris') {
                    return `Berikut pakaian pria kami yang terlaris:\n\n${listPria}\n\nMau detail yang mana, Kak?`;

                }
                else if (searchKey === 'rateTinggi') {
                    return `Berikut pakaian pria kami yang memiliki rating tertinggi:\n\n${listPria}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'rateRendah') {
                    return `Berikut pakaian pria kami yang memiliki rating terendah:\n\n${listPria}\n\nMau detail yang mana, Kak?`;

                } else if (searchKey === 'baju' || searchKey === 'celana' || searchKey === 'jaket') {
                    return `Berikut pakaian pria kami untuk kategori tersebut:\n\n${listPria}\n\nMau detail yang mana, Kak?`;
                }
                
                return `Menu Pakaian Pria Adidas:
1. *baju* - lihat koleksi kaos & t-shirt
2. *celana* - lihat koleksi celana panjang & pendek
3. *jaket* - lihat koleksi jaket & hoodie
4. *murah* - rekomendasi pakaian termurah
5. *mahal* - lihat pakaian premium
6. *laris* - pakaian paling laku
7. *rating tinggi* - rekomendasi pelanggan

Yuk balas dengan kata kunci di atas untuk melihat daftarnya!`;
            }
        }
        else {
            return `Maaf belum ada data mengenai Produk Pakaian Pria`
        }

    }
}

module.exports = PriaController