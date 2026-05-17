
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
    const botNumber = infoData.success ? infoData.number : window.location.href = '/';

    const pesanAwal = "Halo kak, Saya mau tanya tentang produk " + productName;
    const pesanEncoded = encodeURIComponent(pesanAwal);

    window.open(`https://wa.me/${botNumber}?text=${pesanEncoded}"`, "_blank");
  } catch (error) {

  }
}
