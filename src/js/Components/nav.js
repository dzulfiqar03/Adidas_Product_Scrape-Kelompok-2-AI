const listNav = {
    'Setting Configuration': "/",
    Home: "/home",
    Product: "/product"
};

async function ambilDataNav() {
    try {
        const List = Object.keys(listNav).map((key) => {
            return {
                name: key, // Nama kategori (accesories / kids)
                link: listNav[key],
            };
        });


        if (List && List.length > 0) {            const path = window.location.pathname;
            document.getElementById("nav-link").innerHTML = List.map(
                (baris) => `
          <a href="${baris.link}" aria-current="page" class=" cursor-pointer ${path === baris.link? 'bg-gray-800':'bg-transparent'} border border-gray-100 hover:bg-gray-950  transition-all duration-75 rounded-md  px-3 py-2 text-sm font-medium text-white dark:bg-gray-950/50">${baris.name}</a>


            `,
            ).join("");




            document.getElementById("nav-linkMobile").innerHTML = List.map(
                (baris) => `
           <a
            href="${baris.link}"
            aria-current="page"
            class="${path === baris.link? 'bg-gray-900':'bg-transparent'} block rounded-md border border-purple-800  px-3 py-2 text-base font-medium text-white dark:bg-gray-950/50"
            >${baris.name}</a
          >


            `,
            ).join("");

    
        } else {
            console.warn("Data kosong atau tidak ditemukan");
        }
    } catch (error) {
        console.error("Gagal mengambil data:", error);
    }
}

ambilDataNav();