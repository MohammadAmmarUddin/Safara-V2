import { useState, useEffect } from "react";
import { Helmet } from "react-helmet";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import { PiPencilCircleDuotone } from "react-icons/pi";
import { BsTrash } from "react-icons/bs";

const ManageOtherCard = () => {
  const [cards, setCards] = useState([]);
  const [selectedCard, setSelectedCard] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();
  const baseUrl = import.meta.env.VITE_SAFARA_baseUrl;

  const fetchProjects = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/other-projects`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setCards(data);
    } catch (err) {
      console.error("Error fetching projects:", err);
      Swal.fire("Error", "Failed to load projects!", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCardClick = (card) => setSelectedCard(card);
  const closeModal = () => setSelectedCard(null);

  const handleEdit = (card) => {
    navigate("/dashboard/admin/otherProjectUpload", { state: card });
  };

  const handleDelete = async (id) => {
    Swal.fire({
      title: "Are you sure?",
      text: "This will permanently delete the project.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await fetch(`${baseUrl}/api/other-projects/${id}`, {
            method: "DELETE",
          });
          Swal.fire("Deleted!", "The project has been deleted.", "success");
          fetchProjects();
        } catch (err) {
          console.error("Delete failed:", err);
          Swal.fire("Error", "Failed to delete project!", "error");
        }
      }
    });
  };

  return (
    <div className="container mx-auto p-6 bg-gray-100 min-h-screen">
      <Helmet>
        <title>Our Other Projects - Safara</title>
        <meta
          name="description"
          content="Explore Safara's other projects — modern, eco-friendly, and premium developments built with quality and innovation."
        />
      </Helmet>

      <h1 className="text-4xl font-extrabold mb-8 text-center text-indigo-600">
        Our Other Projects
      </h1>

      {/* 🔹 Loader */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-indigo-600 border-solid"></div>
        </div>
      ) : cards.length === 0 ? (
        <p className="text-center text-gray-600 text-lg">
          No projects available yet.
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card._id}
              className="relative bg-white shadow-md rounded-xl overflow-hidden hover:shadow-xl transform hover:scale-[1.02] transition duration-300"
            >
              {/* Floating Edit/Delete Buttons */}
              <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
                <button
                  onClick={() => handleEdit(card)}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white p-2.5 rounded-full shadow-md transition-transform hover:rotate-6"
                  title="Edit Project"
                >
                  <PiPencilCircleDuotone className="h-5 w-5" />
                </button>
                <button
                  onClick={() => handleDelete(card._id)}
                  className="bg-red-600 hover:bg-red-700 text-white p-2.5 rounded-full shadow-md transition-transform hover:-rotate-6"
                  title="Delete Project"
                >
                  <BsTrash className="h-5 w-5" />
                </button>
              </div>

              <img
                src={card.img || "/placeholder.jpg"}
                alt={card?.title}
                className="w-full h-48 object-cover cursor-pointer"
                onClick={() => handleCardClick(card)}
              />

              <div
                className="p-4 cursor-pointer"
                onClick={() => handleCardClick(card)}
              >
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm line-clamp-3">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 🔹 Modal View */}
      {selectedCard && (
        <div className="fixed inset-0 flex justify-center items-center bg-black bg-opacity-60 z-50 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-2xl shadow-xl w-96 max-w-full animate-fadeIn">
            <h2 className="text-2xl font-bold text-indigo-600 mb-3 text-center">
              {selectedCard.title}
            </h2>
            <img
              src={selectedCard.img || "/placeholder.jpg"}
              alt={selectedCard?.title}
              className="w-full h-52 object-cover rounded-lg mb-4"
            />
            <p className="text-gray-700 mb-6 text-sm leading-relaxed">
              {selectedCard.description}
            </p>
            <button
              onClick={closeModal}
              className="w-full py-3 bg-indigo-600 text-white rounded-lg font-semibold hover:bg-indigo-700 transition duration-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageOtherCard;
