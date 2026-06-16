// CEK LOGIN
const myToken = localStorage.getItem("token_toko");

if (!myToken) {
  alert("Anda harus login terlebih dahulu!");
  window.location.href = "login.html";
}

document.addEventListener("DOMContentLoaded", function () {
  let semuaData = [];
  let modeEdit = false;

  const URL_GET    = "http://localhost/toko-app-main/api-toko/get-barang.php";   // ← BARU
  const URL_TAMBAH = "http://localhost/toko-app-main/api-toko/tambah_barang.php";
  const URL_HAPUS  = "http://localhost/toko-app-main/api-toko/hapus_barang.php";
  const URL_EDIT   = "http://localhost/toko-app-main/api-toko/edit_barang.php";

  // =========================
  // AMBIL DATA (GET)
  // =========================
  async function ambilDataBarang() {
    try {
      const response = await fetch(URL_GET, {  // ← DIPERBAIKI: pakai URL_GET bukan URL_TAMBAH
        method: "GET",
        headers: {
          Authorization: myToken,
        },
      });

      const text = await response.text();
      console.log("GET Response:", text);

      const hasil = text ? JSON.parse(text) : {};

      if (hasil.status === "success") {
        semuaData = hasil.data || [];
        tampilkanData(semuaData);
      } else {
        console.error("Response tidak sesuai:", hasil);
      }
    } catch (error) {
      console.error("Gagal mengambil data:", error);
    }
  }

  // =========================
  // TAMPILKAN DATA
  // =========================
  function tampilkanData(data) {
    let barisHTML = "";

    data.forEach((barang) => {
      // URL gambar — fallback jika tidak ada
      let urlGambar = barang.gambar
        ? `http://localhost/toko-app-main/api-toko/uploads/${barang.gambar}`
        : `https://via.placeholder.com/50?text=No+Img`;

      barisHTML += `
        <tr class="text-center hover:bg-gray-50 transition">
          <td class="px-6 py-3">
            <img src="${urlGambar}" class="w-12 h-12 object-cover rounded mx-auto border">
          </td>
          <td class="px-6 py-3">${barang.ID}</td>
          <td class="px-6 py-3">${barang.nama_barang}</td>
          <td class="px-6 py-3">Rp ${Number(barang.harga).toLocaleString("id-ID")}</td>
          <td class="px-6 py-3 flex justify-center gap-2">
            <button
              onclick="isiFormEdit('${barang.ID}', '${barang.nama_barang}', '${barang.harga}')"
              class="bg-yellow-400 hover:bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              ✏️ Edit
            </button>
            <button
              onclick="hapusBarang('${barang.ID}', '${barang.nama_barang}')"
              class="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-xs font-semibold transition"
            >
              🗑️ Hapus
            </button>
          </td>
        </tr>
      `;
    });

    document.getElementById("tabel-barang").innerHTML = barisHTML;
    document.getElementById("total-barang").textContent = data.length;
  }

  // =========================
  // SEARCH
  // =========================
  document.getElementById("search").addEventListener("input", function () {
    const keyword = this.value.toLowerCase();
    const hasilFilter = semuaData.filter((barang) =>
      barang.nama_barang.toLowerCase().includes(keyword)
    );
    tampilkanData(hasilFilter);
  });

  // =========================
  // TAMBAH / UPDATE BARANG
  // =========================
  document.getElementById("btn-simpan").addEventListener("click", async function () {
    const id    = document.getElementById("input-id").value.trim();
    const nama  = document.getElementById("input-nama").value.trim();
    const harga = document.getElementById("input-harga").value.trim();

    if (!nama || !harga) {
      alert("⚠️ Nama barang dan harga tidak boleh kosong!");
      return;
    }

    if (modeEdit && id) {
      await updateBarang(id, nama, harga);
    } else {
      await tambahBarang(nama, harga);
    }
  });

  // -- TAMBAH BARU --
  async function tambahBarang(nama, harga) {
    try {
      // ← DIPERBAIKI: pakai FormData agar bisa kirim gambar sekaligus
      const formData = new FormData();
      formData.append("nama_barang", nama);
      formData.append("harga", harga);

      const gambar = document.getElementById("input-gambar")?.files[0];
      if (gambar) {
        formData.append("gambar", gambar);
      }

      const response = await fetch(URL_TAMBAH, {
        method: "POST",
        headers: {
          Authorization: myToken,
          // JANGAN set Content-Type di sini — browser atur otomatis untuk FormData
        },
        body: formData,
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("POST Response:", hasil);

      if (hasil.status === "success") {
        alert("✅ " + hasil.message);
        resetForm();
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.message || hasil.pesan || "Response tidak valid"));
      }
    } catch (error) {
      console.error("Gagal mengirim data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  }

  // -- UPDATE (EDIT) --
  async function updateBarang(id, nama, harga) {
    try {
      const response = await fetch(URL_EDIT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: myToken,
        },
        body: JSON.stringify({ id: id, nama_barang: nama, harga: parseInt(harga) }),
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("UPDATE Response:", hasil);

      if (hasil.status === "success") {
        alert("✅ " + (hasil.message || "Data berhasil diperbarui!"));
        resetForm();
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.message || "Gagal memperbarui data"));
      }
    } catch (error) {
      console.error("Gagal update data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  }

  // =========================
  // ISI FORM EDIT
  // =========================
  window.isiFormEdit = function (id, nama, harga) {
    modeEdit = true;

    document.getElementById("input-id").value    = id;
    document.getElementById("input-nama").value  = nama;
    document.getElementById("input-harga").value = harga;

    document.getElementById("form-title").textContent = "✏️ Edit Barang (ID: " + id + ")";
    document.getElementById("btn-simpan").textContent = "💾 Update";
    document.getElementById("btn-simpan").classList.replace("bg-emerald-500", "bg-yellow-500");
    document.getElementById("btn-simpan").classList.replace("hover:bg-emerald-600", "hover:bg-yellow-600");
    document.getElementById("btn-batal").classList.remove("hidden");

    document.getElementById("input-nama").focus();
  };

  // =========================
  // BATAL EDIT
  // =========================
  document.getElementById("btn-batal").addEventListener("click", function () {
    resetForm();
  });

  function resetForm() {
    modeEdit = false;

    document.getElementById("input-id").value    = "";
    document.getElementById("input-nama").value  = "";
    document.getElementById("input-harga").value = "";

    const inputGambar = document.getElementById("input-gambar");
    if (inputGambar) inputGambar.value = "";

    document.getElementById("form-title").textContent = "➕ Tambah Barang Baru";
    document.getElementById("btn-simpan").textContent = "💾 Simpan";
    document.getElementById("btn-simpan").classList.replace("bg-yellow-500", "bg-emerald-500");
    document.getElementById("btn-simpan").classList.replace("hover:bg-yellow-600", "hover:bg-emerald-600");
    document.getElementById("btn-batal").classList.add("hidden");
  }

  // =========================
  // HAPUS BARANG
  // =========================
  window.hapusBarang = async function (id, nama) {
    const konfirmasi = confirm(
      `⚠️ Apakah kamu yakin ingin menghapus barang:\n"${nama}" (ID: ${id})?\n\nTindakan ini tidak dapat dibatalkan!`
    );

    if (!konfirmasi) return;

    try {
      const response = await fetch(URL_HAPUS, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: myToken,
        },
        body: JSON.stringify({ id: id }),
      });

      const text  = await response.text();
      const hasil = text ? JSON.parse(text) : {};

      console.log("DELETE Response:", hasil);

      if (hasil.status === "success") {
        alert("🗑️ " + (hasil.pesan || "Barang berhasil dihapus!"));
        ambilDataBarang();
      } else {
        alert("❌ " + (hasil.pesan || "Gagal menghapus data"));
      }
    } catch (error) {
      console.error("Gagal menghapus data:", error);
      alert("❌ Terjadi kesalahan koneksi ke server.");
    }
  };

  // =========================
  // LOAD AWAL
  // =========================
  ambilDataBarang();

  // =========================
  // SERVICE WORKER
  // =========================
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker
      .register("./sw.js")
      .then((reg) => console.log("Service Worker berhasil:", reg.scope))
      .catch((err) => console.log("Gagal:", err));
  }

  window.logout = function () {
    localStorage.removeItem("token_toko");
    window.location.href = "login.html";
  };
});