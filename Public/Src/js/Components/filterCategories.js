// 1. Samakan nama key dengan backend (kids_infant) agar mapping link tidak rusak
const list = {
  all: "all",
  accesories: "accesories",
  kids_infant: "kids", // Diubah dari 'kids' menjadi 'kids_infant'
  football: "football",
  pakaian_pria: "pakaian_pria",
  training: "training"
};

window.renderSection = function (categoryName) {
  try {
    // 🟢 Ambil dari window.globalData yang sudah diisi saat filterCategories dijalankan
    const dataUtama = window.globalData?.data;

    if (!dataUtama) {
      console.warn("Mencoba merender, tetapi globalData belum siap.");
      return;
    }

    // Ambil data kategori secara aman dengan fallback array kosong []
    const categoryData = dataUtama[categoryName];
    let allData = [];
    
    if (Array.isArray(categoryData) && categoryData[0]) {
      allData = categoryData[0].results || categoryData; 
    } else if (categoryData) {
      allData = categoryData.results || [];
    }

    console.log(`Mengambil data untuk kategori [${categoryName}]:`, allData);

    if (allData && allData.length > 0) {
      document.getElementById("card").innerHTML = allData
        .map(
          (baris) => {
            const namaProduk = baris["whitespace-normal"] || baris["nama"] || "Produk Adidas";
            const gambarProduk = baris["_image_yazkc_11 src"] || baris["image"] || "";
            const linkProduk = baris["contents href"] || baris["link"] || "#";
            const ratingProduk = baris["inline-block"] || "-";
            const terjualProduk = baris["truncate"] || "";
            const hargaProduk = baris["font-medium 2"] || baris["harga"] || "Hubungi Admin";

            return `
              <div id="${categoryName}" class="group relative bg-white p-2 rounded-md shadow-sm border border-gray-100">
                <div class="absolute m-2 flex z-10">
                  <button onclick="window.OnClickWA('${namaProduk.replace(/'/g, "\\'")}')"
                    class="w-8 h-8 bg-gray-900 hover:bg-black rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4 text-white fill-current" viewBox="0 0 24 24">
                      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"></path>
                    </svg>
                  </button>
                </div>
                <img src="${gambarProduk}" alt="Gambar ${namaProduk}" class="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80" />
                <div class="mt-4 flex justify-between">
                  <div>
                    <h3 class="text-sm text-gray-700">
                      <a href="${linkProduk}">
                        <span aria-hidden="true" class="absolute inset-0"></span>
                        <p class="capitalize font-medium">${namaProduk}</p>
                      </a>
                    </h3>
                    <div class="flex m-auto space-x-2 mt-1">
                      <p class="text-sm capitalize font-semibold text-amber-500">⭐️${ratingProduk}</p>
                      <p class="truncate text-xs text-gray-500">${terjualProduk}</p>
                    </div>
                  </div>
                  <p class="text-sm m-auto font-semibold text-gray-950">${hargaProduk}</p>
                </div>
              </div>
            `;
          }
        )
        .join("");
    } else {
      console.warn("Data kosong atau tidak ditemukan");
      document.getElementById("card").innerHTML = `<div class="col-span-full text-center py-10 text-gray-500">Produk tidak ditemukan.</div>`;
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
};

async function filterCategories() {
  try {
    const response = await fetch("/api/baca-csv");
    const json = await response.json();

    if (json.status === "success") {
      // 🟢 KUNCI PERBAIKAN: Simpan payload json ke window.globalData agar bisa dibaca fungsi renderSection
      window.globalData = json;
      console.log("✅ globalData berhasil disimpan ke window:", window.globalData);

      const categories = Object.keys(json.data).map((key) => {
        return {
          name: key, 
          link: list[key] || "#",
        };
      });
      console.log("Daftar Kategori Terdeteksi:", categories);

      if (categories && categories.length > 0) {
        document.getElementById("listCategory").innerHTML = categories
          .map(
            (baris) => `
              <li>
                <button type="button" class="capitalize px-3 py-1 hover:text-blue-600 transition-colors" onclick="renderSection('${baris.name}')">
                  ${baris.name.replace('_', ' ')}
                </button>
              </li>
            `,
          )
          .join("");
          
        // 🟢 Otomatis tampilkan kategori "all" saat halaman pertama kali terbuka
        window.renderSection("all");
      } else {
        console.warn("Data kategori kosong");
      }
    }
  } catch (error) {
    console.error("Gagal mengambil data kategori:", error);
  }
}

// Jalankan fungsi inisialisasi kategori saat file dimuat
filterCategories();