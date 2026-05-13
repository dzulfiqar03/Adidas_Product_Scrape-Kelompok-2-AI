
let globalData = {};
async function readCsv() {
  try {
    const response = await fetch("/api/baca-csv");
    const json = await response.json();

    globalData = json;
    renderSection("all");

    console.log(globalData);
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}
readCsv();

window.OnClickWA = async function (productName) {
  try {
    const infoRes = await fetch('/api/bot/info');
    const infoData = await infoRes.json();

    // Gunakan nomor hasil scan, atau fallback ke nomor default jika bot offline
    const botNumber = infoData.success ? infoData.number : "628xxx";

    const pesanAwal = "Halo kak, Saya mau tanya tentang produk " + productName;
    const pesanEncoded = encodeURIComponent(pesanAwal);

    window.open(`https://wa.me/${botNumber}?text=${pesanEncoded}"`, "_blank");
  } catch (error) {

  }
}
window.renderSection = function (categoryName) {
  try {
    const allData = globalData.data?.[categoryName][0].results || [];

    console.log(allData);

    if (allData && allData.length > 0) {
      document.getElementById("card").innerHTML = allData
        .map(
          (baris) => `
                      <div id="${categoryName}" class="group relative">

        <div class="absolute m-2 flex z-10">
          <button    onclick="window.OnClickWA('${baris["whitespace-normal"].replace(/'/g, "\\'")}')"
            class="w-8 h-8 md:w-8 md:h-8 bg-gray-900 hover:bg-black rounded-full flex items-center justify-center text-white shadow-xl transition-all active:scale-95"
          >
            <!-- Sun Icon -->
            <svg
              xmlns="http://www.w3.org/2000/svg"
              class="w-6 h-6 text-white fill-current transition-all duration-300"
              viewBox="0 0 24 24"
            >
              <path
                d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"
              ></path>
            </svg>
          </button>
        </div>
        <img 
          src="${baris["_image_yazkc_11 src"]}" 
                alt="Gambar ${baris["whitespace-normal"]}" 
        class="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80" />
        <div class="mt-4 flex justify-between">
          <div>
            <h3 class="text-sm text-gray-700">
              <a href="${baris["contents href"]}">
                <span aria-hidden="true" class="absolute inset-0"></span>
              <p class="capitalize"> ${baris["whitespace-normal"]}</p>
              </a>
            </h3>
             <div class="flex m-auto space-x-2">
              <p class="text-sm/6 capitalize font-semibold text-gray-900">
               ⭐️${baris["inline-block"]}
              </p>
              <p class="mt-1 truncate text-xs/5 text-gray-500">
                ${baris["truncate"]}
              </p>
            </div>
          </div>
          <p class="text-sm m-auto font-medium text-gray-900">${baris["font-medium 2"]}</p>
        </div>


      </div>

            `,
        )
        .join("");
    } else {
      console.warn("Data kosong atau tidak ditemukan");
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
};
