const SUPABASE_URL = "https://cxniuhfgcggqwpmduwrx.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_bHIo5bXlNrwVwDOd8q2_-A_cjHG6KRU";

const supabaseClient = window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_ANON_KEY
);

// Éléments de l'administration
const adminRole = document.getElementById("adminRole");
const adminMessage = document.getElementById("adminMessage");
const logoutButton = document.getElementById("logoutButton");

// Statistiques du tableau de bord
const adminTotalStudents = document.getElementById("adminTotalStudents");
const adminTotalArchives = document.getElementById("adminTotalArchives");
const adminStatsMessage = document.getElementById("adminStatsMessage");

// Gestion des étudiants
const searchInput = document.getElementById("adminSearchStudent");
const islandFilter = document.getElementById("adminFilterIsland");
const studentsTotal = document.getElementById("adminStudentsTotal");
const studentsTableBody = document.getElementById("adminStudentsTableBody");
const studentsMessage = document.getElementById("adminStudentsMessage");

// Formulaire de modification
const editModal = document.getElementById("editStudentModal");
const editForm = document.getElementById("editStudentForm");
const cancelEditButton = document.getElementById("cancelEditStudent");

let tousLesEtudiants = [];

function afficherMessage(message, type = "info") {
    if (!adminMessage) return;

    adminMessage.textContent = message;
    adminMessage.className = `admin-message ${type}`;
}

function afficherMessageEtudiants(message, type = "info") {
    if (!studentsMessage) return;

    studentsMessage.textContent = message;
    studentsMessage.className = `management-message ${type}`;
}

function formaterDate(date) {
    if (!date) return "Non renseignée";

    const valeur = new Date(date);

    if (Number.isNaN(valeur.getTime())) {
        return "Non renseignée";
    }

    return new Intl.DateTimeFormat("fr-FR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric"
    }).format(valeur);
}

function ajouterCellule(ligne, valeur) {
    const cellule = document.createElement("td");
    cellule.textContent = valeur || "Non renseigné";
    ligne.appendChild(cellule);
}

function ajouterCelluleTelephone(ligne, telephone) {
    const cellule = document.createElement("td");

    if (telephone) {
        const lien = document.createElement("a");
        lien.textContent = telephone;
        lien.href = `tel:${telephone}`;
        cellule.appendChild(lien);
    } else {
        cellule.textContent = "Non renseigné";
    }

    ligne.appendChild(cellule);
}

// Création d'un bouton d'action
function creerBouton(texte, classe, action) {
    const bouton = document.createElement("button");

    bouton.type = "button";
    bouton.textContent = texte;
    bouton.className = classe;

    bouton.addEventListener("click", action);

    return bouton;
}

// Chargement des statistiques
async function chargerStatistiquesAdmin() {
    if (adminStatsMessage) {
        adminStatsMessage.textContent = "Actualisation des statistiques...";
    }

    try {
        const [
            resultatEtudiants,
            resultatArchives
        ] = await Promise.all([
            supabaseClient
                .from("etudiants")
                .select("id", { count: "exact", head: true }),

            supabaseClient
                .from("etudiants_archives")
                .select("id", { count: "exact", head: true })
        ]);

        if (resultatEtudiants.error) {
            throw resultatEtudiants.error;
        }

        if (resultatArchives.error) {
            throw resultatArchives.error;
        }

        if (adminTotalStudents) {
            adminTotalStudents.textContent =
                resultatEtudiants.count ?? 0;
        }

        if (adminTotalArchives) {
            adminTotalArchives.textContent =
                resultatArchives.count ?? 0;
        }

        if (adminStatsMessage) {
            adminStatsMessage.textContent =
                "Statistiques actualisées.";
        }

    } catch (error) {
        console.error("Erreur de chargement des statistiques :", error);

        if (adminStatsMessage) {
            adminStatsMessage.textContent =
                "Impossible de charger les statistiques. Vérifie les autorisations Supabase.";
        }
    }
}

// Affichage des étudiants
function afficherEtudiants(liste) {
    if (!studentsTableBody) return;

    studentsTableBody.replaceChildren();

    if (studentsTotal) {
        studentsTotal.textContent =
            `${liste.length} étudiant(s) affiché(s)`;
    }

    if (liste.length === 0) {
        const ligne = document.createElement("tr");
        const cellule = document.createElement("td");

        cellule.colSpan = 11;
        cellule.textContent = "Aucun étudiant trouvé.";
        cellule.className = "management-message";

        ligne.appendChild(cellule);
        studentsTableBody.appendChild(ligne);

        return;
    }

    liste.forEach(etudiant => {
        const ligne = document.createElement("tr");

        ajouterCellule(ligne, etudiant.nom);
        ajouterCellule(ligne, etudiant.prenom);
        ajouterCellule(ligne, etudiant.ile);
        ajouterCellule(ligne, etudiant.ville);
        ajouterCellule(ligne, etudiant.quartier_origine);
        ajouterCellule(ligne, etudiant.filiere);
        ajouterCellule(ligne, etudiant.universite);
        ajouterCellule(ligne, etudiant.residence);
        ajouterCelluleTelephone(ligne, etudiant.telephone);
        ajouterCellule(ligne, formaterDate(etudiant.date_inscription));

        // Actions disponibles : Modifier et Archiver
        const celluleActions = document.createElement("td");
        const conteneur = document.createElement("div");

        conteneur.className = "student-actions";

        const boutonModifier = creerBouton(
            "Modifier",
            "edit-student-button",
            () => ouvrirModification(etudiant)
        );

        const boutonArchiver = creerBouton(
            "Archiver",
            "archive-student-button",
            () => archiverEtudiant(etudiant.id, boutonArchiver)
        );

        conteneur.append(
            boutonModifier,
            boutonArchiver
        );

        celluleActions.appendChild(conteneur);
        ligne.appendChild(celluleActions);

        studentsTableBody.appendChild(ligne);
    });
}

// Recherche et filtre
function filtrerEtudiants() {
    const recherche =
        searchInput?.value.trim().toLowerCase() || "";

    const ileChoisie = islandFilter?.value || "";

    const resultats = tousLesEtudiants.filter(etudiant => {
        const nomComplet =
            `${etudiant.nom || ""} ${etudiant.prenom || ""}`
                .toLowerCase();

        const correspondRecherche =
            nomComplet.includes(recherche);

        const correspondIle =
            !ileChoisie || etudiant.ile === ileChoisie;

        return correspondRecherche && correspondIle;
    });

    afficherEtudiants(resultats);
}

// Chargement des étudiants
async function chargerEtudiants() {
    if (!studentsTableBody) return;

    afficherMessageEtudiants("Chargement des étudiants...");

    try {
        const { data, error } = await supabaseClient
            .from("etudiants")
            .select(`
                id,
                nom,
                prenom,
                ile,
                ville,
                quartier_origine,
                filiere,
                universite,
                residence,
                telephone,
                date_inscription
            `)
            .order("date_inscription", { ascending: false })
            .range(0, 999);

        if (error) throw error;

        tousLesEtudiants = data || [];

        filtrerEtudiants();

        afficherMessageEtudiants("");

    } catch (error) {
        console.error("Erreur de chargement :", error);

        afficherMessageEtudiants(
            "Impossible de charger les étudiants. Vérifie les autorisations Supabase.",
            "error"
        );
    }
}

// Ouvrir le formulaire de modification
function ouvrirModification(etudiant) {
    if (!editModal || !editForm) return;

    document.getElementById("editStudentId").value = etudiant.id;
    document.getElementById("editNom").value = etudiant.nom || "";
    document.getElementById("editPrenom").value = etudiant.prenom || "";
    document.getElementById("editIle").value = etudiant.ile || "Anjouan";
    document.getElementById("editVille").value = etudiant.ville || "";
    document.getElementById("editQuartier").value =
        etudiant.quartier_origine || "";
    document.getElementById("editFiliere").value = etudiant.filiere || "";
    document.getElementById("editUniversite").value =
        etudiant.universite || "";
    document.getElementById("editResidence").value =
        etudiant.residence || "";
    document.getElementById("editTelephone").value =
        etudiant.telephone || "";

    editModal.hidden = false;
}

// Fermer le formulaire
function fermerModification() {
    if (editModal) editModal.hidden = true;
}

cancelEditButton?.addEventListener("click", fermerModification);

// Enregistrer les modifications
editForm?.addEventListener("submit", async function(event) {
    event.preventDefault();

    const bouton = document.getElementById("saveStudentChanges");

    if (bouton) {
        bouton.disabled = true;
        bouton.textContent = "Enregistrement...";
    }

    const id = document.getElementById("editStudentId").value;

    const modifications = {
        nom: document.getElementById("editNom").value.trim(),
        prenom: document.getElementById("editPrenom").value.trim(),
        ile: document.getElementById("editIle").value,
        ville: document.getElementById("editVille").value.trim(),
        quartier_origine:
            document.getElementById("editQuartier").value.trim(),
        filiere: document.getElementById("editFiliere").value.trim(),
        universite:
            document.getElementById("editUniversite").value.trim(),
        residence:
            document.getElementById("editResidence").value.trim(),
        telephone:
            document.getElementById("editTelephone").value.trim()
    };

    try {
        const { error } = await supabaseClient
            .from("etudiants")
            .update(modifications)
            .eq("id", id);

        if (error) throw error;

        fermerModification();

        afficherMessage(
            "Les informations de l'étudiant ont été modifiées.",
            "success"
        );

        await chargerEtudiants();

    } catch (error) {
        console.error("Erreur de modification :", error);

        afficherMessage(
            "La modification a échoué. Vérifie les autorisations Supabase.",
            "error"
        );

    } finally {
        if (bouton) {
            bouton.disabled = false;
            bouton.textContent = "Enregistrer les modifications";
        }
    }
});

// Archiver un étudiant
async function archiverEtudiant(id, bouton) {
    if (!id || bouton.disabled) return;

    const confirmation = window.confirm(
        "Voulez-vous vraiment archiver cet étudiant ? Sa fiche sera déplacée dans les archives."
    );

    if (!confirmation) return;

    bouton.disabled = true;
    bouton.textContent = "Archivage...";

    try {
        const { error } = await supabaseClient.rpc(
            "archiver_etudiant",
            { p_id: id }
        );

        if (error) throw error;

        afficherMessage(
            "Étudiant archivé avec succès.",
            "success"
        );

        await Promise.all([
            chargerEtudiants(),
            chargerStatistiquesAdmin()
        ]);

    } catch (error) {
        console.error("Erreur d'archivage :", error);

        afficherMessage(
            "L'archivage a échoué. Vérifie la fonction SQL archiver_etudiant.",
            "error"
        );

        bouton.disabled = false;
        bouton.textContent = "Archiver";
    }
}

// Vérification de l'administrateur
async function verifierAdministrateur() {
    try {
        afficherMessage("Vérification de votre accès...");

        const { data: sessionData, error: sessionError } =
            await supabaseClient.auth.getSession();

        if (sessionError) throw sessionError;

        const utilisateur = sessionData.session?.user;

        if (!utilisateur) {
            window.location.replace("login.html");
            return;
        }

        const { data: administrateur, error } = await supabaseClient
            .from("administrateurs")
            .select("role, actif")
            .eq("user_id", utilisateur.id)
            .maybeSingle();

        if (error) throw error;

        if (!administrateur || !administrateur.actif) {
            await supabaseClient.auth.signOut();
            window.location.replace("login.html");
            return;
        }

        const roles = {
            principal: "Administrateur principal",
            presidente: "Présidente",
            secretaire: "Secrétaire"
        };

        if (adminRole) {
            adminRole.textContent =
                roles[administrateur.role] || "Administrateur";
        }

        afficherMessage(
            "Bienvenue dans votre espace d'administration.",
            "success"
        );

        await Promise.all([
            chargerEtudiants(),
            chargerStatistiquesAdmin()
        ]);

    } catch (error) {
        console.error("Erreur de vérification :", error);

        afficherMessage(
            "Une erreur est survenue lors de la vérification de votre accès.",
            "error"
        );
    }
}

// Déconnexion
async function deconnexion() {
    if (logoutButton) {
        logoutButton.disabled = true;
        logoutButton.textContent = "Déconnexion...";
    }

    try {
        const { error } = await supabaseClient.auth.signOut();

        if (error) throw error;

        window.location.replace("login.html");

    } catch (error) {
        console.error("Erreur de déconnexion :", error);

        afficherMessage(
            "La déconnexion a échoué. Veuillez réessayer.",
            "error"
        );

        if (logoutButton) {
            logoutButton.disabled = false;
            logoutButton.textContent = "Se déconnecter";
        }
    }
}

// Événements
searchInput?.addEventListener("input", filtrerEtudiants);
islandFilter?.addEventListener("change", filtrerEtudiants);
logoutButton?.addEventListener("click", deconnexion);

// Initialisation
verifierAdministrateur();