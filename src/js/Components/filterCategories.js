const list = {
  all: "all",
  accesories: "accesories",
  kids: "kids",
};


async function filterCategories() {
  try {
    const response = await fetch("/api/baca-csv");
    const json = await response.json();

    const categories = Object.keys(json.data).map((key) => {
      return {
        name: key, // Nama kategori (accesories / kids)
        link: list[key] || "#",
      };
    });
    console.log(categories);

    if (categories && categories.length > 0) {
      document.getElementById("listCategory").innerHTML = categories
        .map(
          (baris) => `
                      <li>
                    <button type="button" class="capitalize" onclick="renderSection('${baris.name}')">${baris.name}</button>
                  </li>

            `,
        )
        .join("");
    } else {
      console.warn("Data kosong atau tidak ditemukan");
    }
  } catch (error) {
    console.error("Gagal mengambil data:", error);
  }
}

//   async function ambilData() {
//     try {
//       const response = await fetch("/api/baca-csv");
//       const json = await response.json();

//       const categories = Object.keys(json.data);

//       // 2. Gunakan flatMap untuk menggabungkan semua results dari semua kategori menjadi satu array besar
//       const allData = categories.flatMap((category) => {
//         // Kita tambahkan informasi kategori ke dalam tiap baris supaya bisa dipakai di ID/Class
//         return (json.data[category][0]?.results || []).map((item) => ({
//           ...item,
//           categoryName: category,
//         }));
//       });

//       if (allData && allData.length > 0) {
//         document.getElementById("card").innerHTML = allData
//           .map(
//             (baris) => `
//                   <div id="${baris.categoryName}" class="group relative">
//     <img
//       src="${baris["_image_yazkc_11 src"]}"
//             alt="Gambar ${baris["whitespace-normal"]}"
//     class="aspect-square w-full rounded-md bg-gray-200 object-cover group-hover:opacity-75 lg:aspect-auto lg:h-80" />
//     <div class="mt-4 flex justify-between">
//       <div>
//         <h3 class="text-sm text-gray-700">
//           <a href="${baris["contents href"]}">
//             <span aria-hidden="true" class="absolute inset-0"></span>
//           <p class="capitalize"> ${baris["whitespace-normal"]}</p>
//           </a>
//         </h3>
//          <div class="flex m-auto space-x-2">
//           <p class="text-sm/6 capitalize font-semibold text-gray-900">
//            ⭐️${baris["inline-block"]}
//           </p>
//           <p class="mt-1 truncate text-xs/5 text-gray-500">
//             ${baris["truncate"]}
//           </p>
//         </div>
//       </div>
//       <p class="text-sm m-auto font-medium text-gray-900">${baris["font-medium 2"]}</p>
//     </div>
//   </div>

//         `,
//           )
//           .join("");
//       } else {
//         console.warn("Data kosong atau tidak ditemukan");
//       }
//     } catch (error) {
//       console.error("Gagal mengambil data:", error);
//     }
//   }
//   ambilData();

filterCategories();