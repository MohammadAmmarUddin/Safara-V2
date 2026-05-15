import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { FaEdit, FaTrash, FaCloudUploadAlt, FaImage, FaTimes, FaCheck, FaLayerGroup } from "react-icons/fa";

const UploadOtherProject = () => {
  const [projects, setProjects] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [editImg, setEditImg] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/other-projects`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setProjects(data);
    } catch (error) {
      console.error("Error fetching projects:", error);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && droppedFile.type.startsWith("image/")) {
      setFile(droppedFile);
      setPreview(URL.createObjectURL(droppedFile));
    }
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreview(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      return Swal.fire("Required", "Please fill in all fields!", "warning");
    }

    setUploading(true);
    let imageUrl = editImg;

    try {
      if (file) {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "otherProjects");
        const uploadRes = await fetch(`${baseUrl}/api/upload`, {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) throw new Error("Upload failed");
        const data = await uploadRes.json();
        imageUrl = data.url;
      }

      const payload = { title, description, img: imageUrl || "" };

      if (editId) {
        await fetch(`${baseUrl}/api/other-projects/${editId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${baseUrl}/api/other-projects`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      setTitle("");
      setDescription("");
      setFile(null);
      setPreview(null);
      setEditId(null);
      setEditImg(null);

      Swal.fire({
        icon: "success",
        title: editId ? "Project updated!" : "Project uploaded!",
        showConfirmButton: false,
        timer: 1500,
      }).then(() => {
        fetchProjects();
        if (!editId) navigate("/others");
      });
    } catch (err) {
      console.error("Error uploading:", err);
      Swal.fire("Error", "Something went wrong during upload!", "error");
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (project) => {
    setEditId(project._id);
    setTitle(project.title);
    setDescription(project.description);
    setEditImg(project.img);
    setPreview(project.img);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the project.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#6b7280",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${baseUrl}/api/other-projects/${id}`, { method: "DELETE" });
          Swal.fire("Deleted!", "The project has been deleted.", "success");
          fetchProjects();
        } catch (err) {
          console.error("Delete failed:", err);
          Swal.fire("Error", "Failed to delete project!", "error");
        }
      }
    });
  };

  const clearForm = () => {
    setTitle("");
    setDescription("");
    setFile(null);
    setPreview(null);
    setEditId(null);
    setEditImg(null);
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <Helmet>
        <title>Manage Other Projects - Admin</title>
      </Helmet>

      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 sm:p-3 bg-primary/10 rounded-xl">
            <FaLayerGroup className="text-primary text-xl sm:text-2xl" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-primary">Other Projects</h1>
            <p className="text-gray-500 text-xs sm:text-sm mt-0.5">{projects.length} total projects</p>
          </div>
        </div>
      </div>

      {/* Upload / Edit Form */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6 sm:mb-8">
        <div className="bg-gradient-to-r from-primary to-primary/80 px-4 sm:px-6 md:px-8 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2">
                <FaCloudUploadAlt className="text-white/80" />
                {editId ? "Edit Project" : "Upload New Project"}
              </h2>
              <p className="text-white/70 text-xs sm:text-sm mt-1">
                {editId ? "Update the project details below" : "Fill in the details to upload a new project"}
              </p>
            </div>
            {editId && (
              <button
                onClick={clearForm}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition text-sm"
              >
                <FaTimes /> Cancel Edit
              </button>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 md:p-8">
          <div className="grid lg:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
            {/* Left Column - Form Fields */}
            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Project Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter project title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all text-sm sm:text-base"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter detailed project description..."
                  rows={4}
                  className="w-full px-4 py-2.5 sm:py-3 rounded-xl border border-gray-200 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all resize-none text-sm sm:text-base"
                />
              </div>

              <button
                type="submit"
                disabled={uploading}
                className={`w-full py-3 sm:py-4 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all text-sm sm:text-base ${
                  uploading
                    ? "bg-gray-400 cursor-not-allowed"
                    : editId
                    ? "bg-amber-500 hover:bg-amber-600"
                    : "bg-gradient-to-r from-primary to-primary/90 hover:shadow-lg"
                }`}
              >
                {uploading ? (
                  <>
                    <span className="loading loading-spinner loading-sm"></span>
                    Uploading...
                  </>
                ) : editId ? (
                  <>
                    <FaCheck /> Update Project
                  </>
                ) : (
                  <>
                    <FaCloudUploadAlt /> Upload Project
                  </>
                )}
              </button>
            </div>

            {/* Right Column - Image Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project Image
              </label>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`relative border-2 border-dashed rounded-xl transition-all cursor-pointer ${
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-gray-300 hover:border-primary/50 hover:bg-gray-50"
                }`}
              >
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                
                <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10">
                  {preview || editImg ? (
                    <div className="relative w-full">
                      <div className="aspect-video rounded-xl overflow-hidden bg-gray-100">
                        <img
                          src={preview || editImg}
                          alt="Preview"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          setPreview(null);
                          setFile(null);
                          setEditImg(null);
                        }}
                        className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-red-600 transition"
                      >
                        <FaTimes />
                      </button>
                      <div className="mt-3 flex items-center gap-2 text-green-600 text-sm">
                        <FaCheck /> Image selected
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                        <FaImage className="text-primary text-2xl sm:text-3xl" />
                      </div>
                      <p className="text-sm sm:text-base font-medium text-gray-700 mb-1">
                        Drag & drop an image here
                      </p>
                      <p className="text-xs sm:text-sm text-gray-500">
                        or click to browse files
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        Supports: JPG, PNG, GIF, WebP
                      </p>
                    </>
                  )}
                </div>
              </div>
              {(editImg && !preview) && (
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                  <FaCheck className="text-green-500" /> Current image will be kept
                </p>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* Projects Grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {projects.map((p) => (
            <div
              key={p._id}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300 group"
            >
              <div className="relative aspect-video overflow-hidden">
                <img
                  src={p.img || "/placeholder.jpg"}
                  alt={p.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  onError={(e) => {
                    e.target.src = "/placeholder.jpg";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              <div className="p-4 sm:p-5">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-2 line-clamp-1">
                  {p.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-4 min-h-[2.5rem]">
                  {p.description}
                </p>
                
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleEdit(p)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-xl transition text-sm font-medium"
                  >
                    <FaEdit className="text-xs sm:text-sm" /> Edit
                  </button>
                  <button
                    onClick={() => handleDelete(p._id)}
                    className="flex-1 flex items-center justify-center gap-2 py-2 sm:py-2.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl transition text-sm font-medium"
                  >
                    <FaTrash className="text-xs sm:text-sm" /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 sm:p-16 text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
            <FaLayerGroup className="text-gray-300 text-3xl" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Projects Yet</h3>
          <p className="text-gray-500 text-sm">Upload your first project using the form above.</p>
        </div>
      )}
    </div>
  );
};

export default UploadOtherProject;