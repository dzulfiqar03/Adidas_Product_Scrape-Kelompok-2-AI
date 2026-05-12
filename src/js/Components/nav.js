const listNav = {
    Home: "/welcome-page",
    Chatbot: "/",
};

async function ambilDataNav() {
    try {
        const List = Object.keys(listNav).map((key) => {
            return {
                name: key, // Nama kategori (accesories / kids)
                link: listNav[key],
            };
        });

        if (List && List.length > 0) {
            document.getElementById("nav-link").innerHTML = List.map(
                (baris) => `
          <a href="${baris.link}" aria-current="page" class="rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white dark:bg-gray-950/50">${baris.name}</a>


            `,
            ).join("");

            document.getElementById("nav-linkMobile").innerHTML = List.map(
                (baris) => `
           <a
            href="${baris.link}"
            aria-current="page"
            class="block rounded-md bg-gray-900 px-3 py-2 text-base font-medium text-white dark:bg-gray-950/50"
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