class KidsController {
    getChatbotPage(userQuery, searchKey, kidsDocs) {
        if (kidsDocs.length > 0) {
            const isSearchingBaju = userQuery.toLowerCase().includes("baju") || userQuery.toLowerCase().includes("tee") || userQuery.toLowerCase().includes("jersey");
            const isSearchingSepatu = userQuery.toLowerCase().includes("sepatu") || userQuery.toLowerCase().includes("shoes");
            const isSearchingSandal = userQuery.toLowerCase().includes("sandal") || userQuery.toLowerCase().includes("slides");
            const isSearchingCelana = userQuery.toLowerCase().includes("celana") || userQuery.toLowerCase().includes("shorts") || userQuery.toLowerCase().includes("pants");
            const isMurah = userQuery.toLowerCase().includes("murah") || userQuery.toLowerCase().includes("dibawah") || userQuery.toLowerCase().includes("termurah");
            const isMahal = userQuery.toLowerCase().includes("mahal") || userQuery.toLowerCase().includes("diatas") || userQuery.toLowerCase().includes("termahal");
            const isRekomendasi = userQuery.toLowerCase().includes("terbaik") || userQuery.toLowerCase().includes("rekomendasi");
            const isLaris = userQuery.toLowerCase().includes("terlaris") || userQuery.toLowerCase().includes("laris") || userQuery.toLowerCase().includes("paling laris");
            const isRateTinggi = userQuery.toLowerCase().includes("rating tertinggi") || userQuery.toLowerCase().includes("tinggi");
            const isRateRendah = userQuery.toLowerCase().includes("rating terendah") || userQuery.toLowerCase().includes("rendah");

            if (isSearchingBaju) searchKey = 'baju';
            else if (isSearchingSepatu) searchKey = 'sepatu';
            else if (isSearchingSandal) searchKey = 'sandal';
            else if (isSearchingCelana) searchKey = 'celana';
            else if (isMurah) searchKey = 'murah';
            else if (isMahal) searchKey = 'mahal';
            else if (isRekomendasi) searchKey = 'rekomendasi';
            else if (isLaris) searchKey = 'laris';
            else if (isRateTinggi) searchKey = 'rateTinggi';
            else if (isRateRendah) searchKey = 'rateRendah';

            const listKids = kidsDocs
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
                    if (searchKey === 'baju') return item.nama.toLowerCase().includes('tee') || item.nama.toLowerCase().includes('jersey');
                    if (searchKey === 'sepatu') return item.nama.toLowerCase().includes('shoes');
                    if (searchKey === 'sandal') return item.nama.toLowerCase().includes('sandal') || item.nama.toLowerCase().includes('slide');
                    if (searchKey === 'celana') return item.nama.toLowerCase().includes('short') || item.nama.toLowerCase().includes('pant');
                    return true;
                }).sort((a, b) => {
                    if (searchKey === 'murah') return a.harga - b.harga;
                    if (searchKey === 'mahal') return b.harga - a.harga;
                    if (searchKey === 'rekomendasi') {
                        if (b.rate !== a.rate) return b.rate - a.rate;
                        if (b.laris !== a.laris) return b.laris - a.laris;
                        return a.harga - b.harga;
                    }
                    if (searchKey === 'laris') return b.laris - a.laris;
                    if (searchKey === 'rateTinggi') return b.rate - a.rate;
                    if (searchKey === 'rateRendah') return a.rate - b.rate;
                    return true;
                })
                .slice(0, 20) // Batasi agar pesan WA tidak terlalu panjang
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

            if (listKids) {
                if (searchKey === 'murah') return `Berikut daftar koleksi Kids & Infant termurah kami:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (searchKey === 'mahal') return `Berikut daftar koleksi Kids & Infant premium kami:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (searchKey === 'rekomendasi') return `Berikut rekomendasi perlengkapan Kids & Infant kami:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (searchKey === 'laris') return `Berikut perlengkapan Kids & Infant kami yang terlaris:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (searchKey === 'rateTinggi') return `Berikut perlengkapan Kids & Infant dengan rating tertinggi:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (searchKey === 'rateRendah') return `Berikut perlengkapan Kids & Infant dengan rating terendah:\n\n${listKids}\n\nMau detail yang mana, Kak?`;
                if (['baju', 'sepatu', 'sandal', 'celana'].includes(searchKey)) return `Berikut koleksi Kids & Infant untuk kategori tersebut:\n\n${listKids}\n\nMau detail yang mana, Kak?`;

                return `Menu Kids & Infant Adidas:
1. *baju* - lihat koleksi kaos/baju anak
2. *sepatu* - lihat koleksi sepatu anak
3. *sandal* - lihat koleksi sandal anak
4. *celana* - lihat koleksi celana anak
5. *murah* - rekomendasi produk termurah
6. *laris* - produk paling laku
7. *rating tinggi* - rekomendasi pelanggan

Yuk balas dengan kata kunci di atas untuk melihat daftarnya!`;
            }
        }
        return `Maaf belum ada data mengenai Produk Kids & Infant`;
    }
}

module.exports = KidsController;
