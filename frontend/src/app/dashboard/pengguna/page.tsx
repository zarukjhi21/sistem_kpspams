"use client";

import React, { useState, useEffect, useCallback } from "react";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { DemoUser, DEMO_KPSPAMS_LIST } from "@/lib/demo-data";
import { useAuth } from "@/context/AuthContext";
import { apiClient } from "@/lib/api-client";
import {
  UserCheck,
  Search,
  Plus,
  Shield,
  Building2,
  Phone,
  CheckCircle2,
  X,
  Lock,
  User,
  Key,
  Pencil,
  Trash2,
  AlertTriangle,
  Loader2,
  RefreshCw,
} from "lucide-react";

export default function PenggunaPage() {
  return (
    <DashboardLayout>
      <PenggunaContent />
    </DashboardLayout>
  );
}

function PenggunaContent() {
  const { user: currentUser } = useAuth();
  const [usersList, setUsersList] = useState<DemoUser[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("ALL");
  const [kpspamsFilter, setKpspamsFilter] = useState("ALL");

  // Modal State Tambah Pengguna Baru
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [newFullName, setNewFullName] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newRole, setNewRole] = useState<DemoUser["role"]>("petugas_lapangan");
  const [newKpspamsId, setNewKpspamsId] = useState<number | null>(1);
  const [newPassword, setNewPassword] = useState("Kuajang2026!");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modal State Edit Pengguna
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<DemoUser | null>(null);
  const [editFullName, setEditFullName] = useState("");
  const [editUsername, setEditUsername] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editRole, setEditRole] = useState<DemoUser["role"]>("petugas_lapangan");
  const [editKpspamsId, setEditKpspamsId] = useState<number | null>(1);
  const [editPassword, setEditPassword] = useState("");
  const [editError, setEditError] = useState<string | null>(null);

  // Modal State Hapus Pengguna
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<DemoUser | null>(null);

  const getRoleLabel = (role: string) => {
    switch (role) {
      case "super_admin":
        return "Super Admin TI";
      case "admin_desa":
        return "Admin Desa";
      case "pemerintah_desa":
        return "Kepala Desa";
      case "ketua_kpspams":
        return "Ketua KPSPAMS";
      case "admin_kpspams":
        return "Admin KPSPAMS";
      case "bendahara_kpspams":
        return "Bendahara / Kasir";
      case "petugas_lapangan":
        return "Petugas Lapangan";
      case "pelanggan":
        return "Pelanggan / Warga";
      default:
        return "Pengguna";
    }
  };

  const getKpspamsName = (id: number | null) => {
    if (id === 1) return "KPSPAMS Lemo Baru";
    if (id === 2) return "KPSPAMS Lemo Tua";
    if (id === 3) return "KPSPAMS Sarampu 1";
    if (!id) return "Pemerintah Desa Kuajang";
    return `Unit KPSPAMS ${id}`;
  };

  // Muat data pengguna langsung dari database API
  const fetchUsersFromApi = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await apiClient("/users?per_page=100");
      if (res?.status === "success" && Array.isArray(res.data)) {
        const mapped: DemoUser[] = res.data.map((u: any) => {
          const roleName = (u.roles?.[0]?.name || u.role_name || u.role || "petugas_lapangan") as DemoUser["role"];
          const kId = u.kpspams_id !== null && u.kpspams_id !== undefined ? Number(u.kpspams_id) : null;
          return {
            id: u.id,
            name: u.name,
            username: u.username,
            role: roleName,
            roleLabel: getRoleLabel(roleName),
            phone: u.phone || "-",
            kpspamsId: kId,
            kpspamsName: u.kpspams?.name || u.kpspams_name || getKpspamsName(kId),
          };
        });
        setUsersList(mapped);
      }
    } catch (err) {
      console.warn("API pengguna offline, gunakan data cache:", err);
      if (typeof window !== "undefined") {
        const saved = localStorage.getItem("kpspams_users");
        if (saved) {
          try {
            setUsersList(JSON.parse(saved));
          } catch {}
        }
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUsersFromApi();
  }, [fetchUsersFromApi]);

  const handleOpenCreateModal = () => {
    setNewFullName("");
    setNewUsername("");
    setNewPhone("");
    setNewRole("petugas_lapangan");
    setNewKpspamsId(1);
    setNewPassword("Kuajang2026!");
    setErrorMessage(null);
    setCreateModalOpen(true);
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!newFullName.trim()) {
      setErrorMessage("Nama lengkap pengguna wajib diisi.");
      return;
    }
    if (!newUsername.trim()) {
      setErrorMessage("Username login wajib diisi.");
      return;
    }

    const cleanUsername = newUsername.trim().toLowerCase();
    let finalKpspamsId = newKpspamsId;
    if (
      currentUser?.role !== "admin_desa" &&
      currentUser?.role !== "super_admin" &&
      currentUser?.role !== "pemerintah_desa"
    ) {
      finalKpspamsId = currentUser?.kpspamsId || 1;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: newFullName.trim(),
        username: cleanUsername,
        phone: newPhone.trim() || "081200000000",
        password: newPassword,
        role: newRole,
        kpspams_id: finalKpspamsId,
      };

      const res = await apiClient("/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (res?.status === "success") {
        setCreateModalOpen(false);
        setSuccessMessage(
          `Pengguna baru "${newFullName.trim()}" (@${cleanUsername}) dengan hak akses ${getRoleLabel(newRole)} berhasil dibuat di database server!`
        );
        await fetchUsersFromApi();
        setTimeout(() => setSuccessMessage(null), 6000);
      }
    } catch (apiErr: any) {
      const msg = apiErr?.message || (apiErr?.errors ? Object.values(apiErr.errors).flat().join(", ") : "Gagal membuat akun.");
      setErrorMessage(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenEditModal = (u: DemoUser) => {
    setEditingUser(u);
    setEditFullName(u.name);
    setEditUsername(u.username);
    setEditPhone(u.phone || "");
    setEditRole(u.role);
    setEditKpspamsId(u.kpspamsId);
    setEditPassword("");
    setEditError(null);
    setEditModalOpen(true);
  };

  const handleEditUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    setEditError(null);

    if (!editFullName.trim()) {
      setEditError("Nama lengkap pengguna wajib diisi.");
      return;
    }

    let finalKpspamsId = editKpspamsId;
    if (
      currentUser?.role !== "admin_desa" &&
      currentUser?.role !== "super_admin" &&
      currentUser?.role !== "pemerintah_desa"
    ) {
      finalKpspamsId = currentUser?.kpspamsId || 1;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: editFullName.trim(),
        phone: editPhone.trim() || editingUser.phone,
        role: editRole,
        kpspams_id: finalKpspamsId,
      };

      await apiClient(`/users/${editingUser.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      setEditModalOpen(false);
      setSuccessMessage(`Data pengguna "${editFullName.trim()}" (@${editingUser.username}) berhasil diperbarui di server.`);
      await fetchUsersFromApi();
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (apiErr: any) {
      const msg = apiErr?.message || (apiErr?.errors ? Object.values(apiErr.errors).flat().join(", ") : "Gagal memperbarui akun.");
      setEditError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteModal = (u: DemoUser) => {
    setUserToDelete(u);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    if (currentUser && currentUser.username === userToDelete.username) {
      alert("Anda tidak dapat menghapus akun Anda sendiri saat sedang login.");
      setDeleteModalOpen(false);
      return;
    }

    setIsSubmitting(true);
    try {
      await apiClient(`/users/${userToDelete.id}`, {
        method: "DELETE",
      });

      setDeleteModalOpen(false);
      setSuccessMessage(`Akun pengguna "${userToDelete.name}" (@${userToDelete.username}) berhasil dihapus dari database.`);
      await fetchUsersFromApi();
      setTimeout(() => setSuccessMessage(null), 5000);
      setUserToDelete(null);
    } catch (apiErr: any) {
      alert(`Gagal menghapus pengguna: ${apiErr?.message || "Terjadi kesalahan pada server."}`);
      setDeleteModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Guard: Petugas Lapangan & Pelanggan tidak mengelola pengguna
  if (currentUser?.role === "petugas_lapangan" || currentUser?.role === "pelanggan") {
    return (
      <div className="max-w-md mx-auto my-12 p-6 sm:p-8 bg-white rounded-3xl border border-slate-200 text-center shadow-lg space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 mx-auto flex items-center justify-center">
          <Lock className="w-7 h-7" />
        </div>
        <div>
          <h2 className="text-base font-black text-slate-900">Hak Akses Terproteksi</h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Halaman Manajemen Akun & Hak Akses dikhususkan untuk Administrator Pemerintah Desa Kuajang dan Pengurus Unit KPSPAMS.
          </p>
        </div>
        <div className="pt-2">
          <a
            href="/dashboard"
            className="inline-flex items-center justify-center px-4 py-2.5 rounded-xl bg-brand-maroon-800 text-white font-bold text-xs hover:bg-brand-maroon-900 transition shadow"
          >
            Kembali ke Beranda Utama
          </a>
        </div>
      </div>
    );
  }

  const filteredUsers = usersList.filter((u) => {
    // Isolasi unit: pengurus KPSPAMS hanya melihat akun internal unitnya
    if (
      currentUser?.role !== "admin_desa" &&
      currentUser?.role !== "super_admin" &&
      currentUser?.role !== "pemerintah_desa"
    ) {
      if (currentUser?.kpspamsId && u.kpspamsId !== currentUser.kpspamsId) {
        return false;
      }
    }
    if (
      searchTerm &&
      !u.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.username.toLowerCase().includes(searchTerm.toLowerCase()) &&
      !u.phone.includes(searchTerm)
    ) {
      return false;
    }
    if (roleFilter !== "ALL" && u.role !== roleFilter) {
      return false;
    }
    if (kpspamsFilter !== "ALL") {
      if (kpspamsFilter === "DESA" && u.kpspamsId !== null) return false;
      if (kpspamsFilter !== "DESA" && String(u.kpspamsId) !== kpspamsFilter) return false;
    }
    return true;
  });

  return (
    <div className="space-y-5 sm:space-y-6 pb-28 md:pb-8">
      {/* Title & Action Banner */}
      <div className="bg-gradient-to-r from-brand-maroon-900 to-slate-900 text-white p-5 rounded-2xl shadow-md border border-brand-maroon-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-brand-gold-500/20 text-brand-gold-400 text-[11px] font-bold mb-1.5">
            <UserCheck className="w-3.5 h-3.5" />
            <span>Manajemen Pengguna & Otoritas</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight">
            Akun Pengguna Sistem KPSPAMS
          </h1>
          <p className="text-xs text-slate-300 mt-1">
            Pengelolaan akun login pengurus, bendahara/kasir, admin desa, teknisi lapangan, dan warga desa terhubung resmi ke basis data.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={fetchUsersFromApi}
            disabled={isLoading}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />}
          >
            Segarkan
          </Button>
          <Button
            variant="gold"
            size="sm"
            icon={<Plus className="w-4 h-4" />}
            onClick={handleOpenCreateModal}
          >
            + Tambah Pengguna
          </Button>
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start space-x-3 animate-in fade-in duration-200 shadow-sm">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <div className="font-bold text-xs">Pemberitahuan Sistem</div>
            <div className="text-xs text-emerald-800 mt-0.5">{successMessage}</div>
          </div>
          <button
            onClick={() => setSuccessMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Struktur Pengurus KPSPAMS Lemo Baru Berdasarkan SK No. 19 Tahun 2026 */}
      <Card className="p-4 sm:p-5 bg-gradient-to-br from-amber-50/60 via-white to-slate-50 border border-amber-200/80 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3.5 border-b border-amber-200/60">
          <div>
            <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[10px] font-bold uppercase tracking-wider mb-1">
              <Shield className="w-3 h-3 text-amber-700" />
              <span>SK Pengukuhan Resmi Masa Bakti 2026–2029</span>
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
              Struktur Pengurus KPSPAMS Lemo Baru Desa Kuajang
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Keputusan Kepala Desa Kuajang Nomor 19 Tahun 2026 tanggal 30 Juni 2026 • Ditetapkan oleh: <strong>H. MUHAMMAD S.</strong> (Kepala Desa Kuajang)
            </p>
          </div>
          <span className="px-3 py-1 rounded-xl text-xs font-bold bg-brand-maroon-50 text-brand-maroon-900 border border-brand-maroon-200 self-start md:self-auto">
            7 Pengurus Resmi
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-3.5">
          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">1. Ketua</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">FADLI</span>
            <span className="text-[10px] text-emerald-700 font-semibold mt-0.5 block">Penanggung Jawab Utama</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">2. Sekretaris</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">MADA ALI</span>
            <span className="text-[10px] text-blue-700 font-semibold mt-0.5 block">Administrasi &amp; Persuratan</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">3. Bendahara</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">M. DARMAWAN</span>
            <span className="text-[10px] text-amber-700 font-semibold mt-0.5 block">Pengelola Buku Kas &amp; Bank</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">4. Koordinator Penagihan</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">SUARDI</span>
            <span className="text-[10px] text-sky-700 font-semibold mt-0.5 block">Penagihan Iuran Lapangan</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">5. Koordinator Pemeliharaan</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">SAPRI</span>
            <span className="text-[10px] text-purple-700 font-semibold mt-0.5 block">Teknis Pipa &amp; Pemeliharaan</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">6. Anggota</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">ABDUL WAHAB</span>
            <span className="text-[10px] text-slate-600 font-semibold mt-0.5 block">Tim Operasional Lapangan</span>
          </div>

          <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-2xs">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">7. Anggota</span>
            <span className="text-xs font-black text-slate-900 block mt-0.5">NURHANUDDIN</span>
            <span className="text-[10px] text-slate-600 font-semibold mt-0.5 block">Tim Operasional Lapangan</span>
          </div>

          <div className="p-3 rounded-xl bg-brand-maroon-50/70 border border-brand-maroon-200/80 shadow-2xs flex flex-col justify-center">
            <span className="text-[10px] font-bold text-brand-maroon-700 uppercase tracking-wider block">Pengukuhan</span>
            <span className="text-xs font-black text-brand-maroon-900 block mt-0.5">H. MUHAMMAD S.</span>
            <span className="text-[10px] text-brand-maroon-800 font-medium block">Kepala Desa Kuajang</span>
          </div>
        </div>
      </Card>

      {/* Filter Card */}
      <Card>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari nama, username, atau HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            />
          </div>

          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              <option value="ALL">Semua Peran / Hak Akses</option>
              <option value="admin_desa">Admin Desa</option>
              <option value="pemerintah_desa">Pemerintah Desa / Kades</option>
              <option value="ketua_kpspams">Ketua KPSPAMS</option>
              <option value="admin_kpspams">Admin KPSPAMS</option>
              <option value="bendahara_kpspams">Bendahara / Kasir</option>
              <option value="petugas_lapangan">Petugas Lapangan</option>
              <option value="pelanggan">Warga / Pelanggan</option>
            </select>
          </div>

          <div>
            <select
              value={kpspamsFilter}
              onChange={(e) => setKpspamsFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
            >
              <option value="ALL">Semua Unit Kerja</option>
              <option value="DESA">Pemerintah Desa (Agregat)</option>
              <option value="1">KPSPAMS Lemo Baru</option>
              <option value="2">KPSPAMS Lemo Tua</option>
              <option value="3">KPSPAMS Sarampu 1 & Pakkandoang</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Loading state indicator */}
      {isLoading && (
        <div className="flex items-center justify-center py-10 space-x-2 text-slate-500 text-xs">
          <Loader2 className="w-5 h-5 animate-spin text-brand-maroon-700" />
          <span>Memuat data pengguna dari basis data...</span>
        </div>
      )}

      {/* Mobile Card View (< md) */}
      {!isLoading && (
        <div className="md:hidden space-y-3">
          <div className="text-xs text-slate-500 px-1 font-medium">
            Menampilkan <strong>{filteredUsers.length}</strong> pengguna terdaftar
          </div>

          {filteredUsers.map((u) => (
            <div
              key={u.id}
              className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="font-mono font-extrabold text-xs text-brand-maroon-900 bg-brand-maroon-50 px-2 py-0.5 rounded-md border border-brand-maroon-200">
                  @{u.username}
                </span>
                <Badge variant="brand" size="sm">{u.roleLabel}</Badge>
              </div>

              <div>
                <div className="font-bold text-slate-900 text-sm">{u.name}</div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.kpspamsName}</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center space-x-1.5 mt-0.5">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span>{u.phone}</span>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 flex items-center justify-between text-xs">
                <Badge variant="success" size="sm">Akun Aktif</Badge>
                <div className="flex items-center space-x-1.5">
                  <button
                    type="button"
                    onClick={() => handleOpenEditModal(u)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-bold text-[11px] flex items-center space-x-1 shadow-sm"
                  >
                    <Pencil className="w-3 h-3 text-slate-500" />
                    <span>Edit</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenDeleteModal(u)}
                    className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 font-bold text-[11px] flex items-center space-x-1 shadow-sm"
                  >
                    <Trash2 className="w-3 h-3 text-rose-600" />
                    <span>Hapus</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-xs text-slate-400 bg-white rounded-2xl border border-slate-100">
              Tidak ada pengguna yang cocok dengan kriteria pencarian.
            </div>
          )}
        </div>
      )}

      {/* Desktop Table View (>= md) */}
      {!isLoading && (
        <div className="hidden md:block">
          <Card>
            <CardHeader
              title={`Daftar Pengguna Sistem (${filteredUsers.length} Akun)`}
              subtitle="Akun yang memiliki hak akses login ke sistem SI-KPSPAMS"
            />

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/90 text-slate-600 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Pengguna</th>
                    <th className="py-3 px-4">Username Login</th>
                    <th className="py-3 px-4">Peran / Hak Akses</th>
                    <th className="py-3 px-4">Unit Penugasan</th>
                    <th className="py-3 px-4">No. Handphone</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi Admin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-semibold text-brand-maroon-900">
                        @{u.username}
                      </td>
                      <td className="py-3.5 px-4">
                        <Badge variant="brand" size="sm">{u.roleLabel}</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-slate-700">
                        <div className="font-medium">{u.kpspamsName}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-slate-600">
                        {u.phone}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <Badge variant="success" size="sm">Aktif</Badge>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center space-x-1.5">
                          <button
                            type="button"
                            onClick={() => handleOpenEditModal(u)}
                            title="Edit Pengguna"
                            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition shadow-sm"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleOpenDeleteModal(u)}
                            title="Hapus Pengguna"
                            className="p-1.5 rounded-lg border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 transition shadow-sm"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {filteredUsers.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-xs text-slate-400">
                        Tidak ada pengguna yang cocok dengan kriteria pencarian.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      )}

      {/* Modal Tambah Pengguna Baru */}
      {createModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tambah Akun Pengguna Baru
                </h3>
                <p className="text-xs text-slate-500">
                  Buat akun pengurus, bendahara/kasir, teknisi, atau pengawas desa resmi.
                </p>
              </div>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {errorMessage}
              </div>
            )}

            <form onSubmit={handleCreateUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={newFullName}
                  onChange={(e) => setNewFullName(e.target.value)}
                  placeholder="Contoh: Mansyur, S.Pd."
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username Login <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="Contoh: kasir.lemobaru"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={newPhone}
                    onChange={(e) => setNewPhone(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Peran / Hak Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as DemoUser["role"])}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    <option value="petugas_lapangan">Petugas Lapangan (Catat Meter)</option>
                    <option value="bendahara_kpspams">Bendahara / Kasir KPSPAMS</option>
                    <option value="ketua_kpspams">Ketua KPSPAMS</option>
                    <option value="admin_kpspams">Admin KPSPAMS</option>
                    <option value="admin_desa">Admin Desa</option>
                    <option value="pemerintah_desa">Kepala Desa (Eksekutif)</option>
                    <option value="pelanggan">Warga / Pelanggan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Penugasan KPSPAMS
                  </label>
                  <select
                    value={newKpspamsId === null ? "DESA" : String(newKpspamsId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setNewKpspamsId(v === "DESA" ? null : Number(v));
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    <option value="1">KPSPAMS Lemo Baru (Pilot Project)</option>
                    <option value="2">KPSPAMS Lemo Tua (Persiapan Tahap 2)</option>
                    <option value="3">KPSPAMS Sarampu 1 & Pakkandoang (Persiapan Tahap 2)</option>
                    <option value="DESA">Pemerintah Desa Kuajang (Semua Unit)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi Awal
                </label>
                <input
                  type="text"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-mono border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Pengguna dapat mengubah kata sandi setelah masuk ke aplikasi.
                </span>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setCreateModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Akun Pengguna"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Edit Pengguna */}
      {editModalOpen && editingUser && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center space-x-2">
                  <Pencil className="w-4 h-4 text-brand-maroon-800" />
                  <span>Edit Akun Pengguna</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Ubah data hak akses, peran, atau nomor telepon akun @{editingUser.username}.
                </p>
              </div>
              <button
                onClick={() => setEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {editError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                {editError}
              </div>
            )}

            <form onSubmit={handleEditUserSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Nama Lengkap Pengguna <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Username Login (Tetap)
                  </label>
                  <input
                    type="text"
                    disabled
                    value={editUsername}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-200 bg-slate-100 rounded-xl text-slate-500 cursor-not-allowed"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    No. Handphone / WhatsApp
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs font-mono font-medium border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Peran / Hak Akses <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value as DemoUser["role"])}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    <option value="petugas_lapangan">Petugas Lapangan (Catat Meter)</option>
                    <option value="bendahara_kpspams">Bendahara / Kasir KPSPAMS</option>
                    <option value="ketua_kpspams">Ketua KPSPAMS</option>
                    <option value="admin_kpspams">Admin KPSPAMS</option>
                    <option value="admin_desa">Admin Desa</option>
                    <option value="pemerintah_desa">Kepala Desa (Eksekutif)</option>
                    <option value="pelanggan">Warga / Pelanggan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Unit Penugasan KPSPAMS
                  </label>
                  <select
                    value={editKpspamsId === null ? "DESA" : String(editKpspamsId)}
                    onChange={(e) => {
                      const v = e.target.value;
                      setEditKpspamsId(v === "DESA" ? null : Number(v));
                    }}
                    className="w-full px-3.5 py-2.5 text-xs font-semibold border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-maroon-700 bg-white"
                  >
                    <option value="1">KPSPAMS Lemo Baru (Pilot Project)</option>
                    <option value="2">KPSPAMS Lemo Tua (Persiapan Tahap 2)</option>
                    <option value="3">KPSPAMS Sarampu 1 & Pakkandoang (Persiapan Tahap 2)</option>
                    <option value="DESA">Pemerintah Desa Kuajang (Semua Unit)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-3 border-t border-slate-100">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditModalOpen(false)}
                  disabled={isSubmitting}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  className="font-bold"
                  disabled={isSubmitting}
                  icon={isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : undefined}
                >
                  {isSubmitting ? "Menyimpan..." : "Simpan Perubahan Akun"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Hapus Pengguna */}
      {deleteModalOpen && userToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-150 space-y-4">
            <div className="flex items-start space-x-3.5">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Hapus Akun Pengguna?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus akun{" "}
                  <strong className="text-slate-900">{userToDelete.name}</strong> (
                  <span className="font-mono text-brand-maroon-800">@{userToDelete.username}</span>)?
                  Akun ini akan dihapus secara permanen dari basis data sistem SI-KPSPAMS.
                </p>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
              <div className="flex justify-between">
                <span className="text-slate-500">Peran:</span>
                <span className="font-bold text-slate-800">{userToDelete.roleLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Unit:</span>
                <span className="font-bold text-slate-800">{userToDelete.kpspamsName}</span>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-2 pt-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => setDeleteModalOpen(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition shadow-md shadow-rose-600/20 flex items-center space-x-1.5"
              >
                {isSubmitting ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
                <span>{isSubmitting ? "Menghapus..." : "Ya, Hapus Akun"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
