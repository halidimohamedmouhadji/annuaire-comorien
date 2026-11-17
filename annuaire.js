const SUPABASE_URL = "https://cxniuhfgcggqwpmduwrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bHIo5bXlNrwVwDOd8q2_-A_cjHG6KRU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

const studentsGrid = document.getElementById("studentsGrid");
const directoryCount = document.getElementById("directoryCount");
const directoryMessage = document.getElementById("directoryMessage");

const searchName = document.getElementById("searchName");
const filterIsland = document.getElementById("filterIsland");
const filterField = document.getElementById("filterField");

let allStudents = [];

function afficherMessage(message, type = "info") {
    if (!directoryMessage) return;

    directoryMessage.textContent = message;
    directoryMessage.className = `directory-message ${type}`;
}

function afficherEtudiants(students) {
    if (!studentsGrid) return;

    studentsGrid.replaceChildren();

    if (directoryCount) {
        directoryCount.textContent =
            `${students.length} étudiant${students.length > 1 ? "s" : ""}`;
    }

    if (students.length === 0) {
        const emptyState = document.createElement("div");
        emptyState.className = "empty-state";
        emptyState.textContent = "Aucun étudiant ne correspond à votre recherche.";
        studentsGrid.appendChild(emptyState);
        return;
    }

    students.forEach(student => {
        const card = document.createElement("article");
        card.className = "student-card";

        const avatar = document.createElement("div");
        avatar.className = "student-avatar";

        const initials =
            `${student.prenom?.charAt(0) || ""}${student.nom?.charAt(0) || ""}`;

        avatar.textContent = initials.toUpperCase();

        const info = document.createElement("div");
        info.className = "student-info";

        const name = document.createElement("h3");
        name.textContent = `${student.prenom || ""} ${student.nom || ""}`;

        const island = document.createElement("p");
        island.textContent = `Île : ${student.ile || "Non renseignée"}`;

        const field = document.createElement("p");
        field.textContent = `Filière : ${student.filiere || "Non renseignée"}`;

        info.append(name, island, field);
        card.append(avatar, info);
        studentsGrid.appendChild(card);
    });
}

function filtrerEtudiants() {
    const nameSearch = searchName?.value.trim().toLowerCase() || "";
    const selectedIsland = filterIsland?.value || "";
    const selectedField = filterField?.value || "";

    const filteredStudents = allStudents.filter(student => {
        const fullName =
            `${student.prenom || ""} ${student.nom || ""}`.toLowerCase();

        const matchesName = fullName.includes(nameSearch);
        const matchesIsland =
            !selectedIsland || student.ile === selectedIsland;
        const matchesField =
            !selectedField ||
            (student.filiere || "").toLowerCase().includes(
                selectedField.toLowerCase()
            );

        return matchesName && matchesIsland && matchesField;
    });

    afficherEtudiants(filteredStudents);
}

async function chargerEtudiants() {
    afficherMessage("Chargement des étudiants...");

    if (studentsGrid) {
        studentsGrid.replaceChildren();
    }

    try {
        const { data, error } = await supabaseClient
            .from("annuaire_public")
            .select("nom, prenom, ile, filiere")
            .order("nom", { ascending: true });

        if (error) throw error;

        allStudents = data || [];

        afficherMessage("");
        filtrerEtudiants();

    } catch (error) {
        console.error("Erreur de chargement :", error);

        afficherMessage(
            "Impossible de charger l'annuaire. Veuillez réessayer plus tard.",
            "error"
        );

        if (directoryCount) {
            directoryCount.textContent = "0 étudiant";
        }
    }
}

searchName?.addEventListener("input", filtrerEtudiants);
filterIsland?.addEventListener("change", filtrerEtudiants);
filterField?.addEventListener("change", filtrerEtudiants);

chargerEtudiants();