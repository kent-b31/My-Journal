// ============================
// Entries CONFIG
// ============================

const SUPABASE_URL =
'https://qkuhuexbwwkeyjhamlpu.supabase.co';

const SUPABASE_KEY =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrdWh1ZXhid3drZXlqaGFtbHB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA3NTAyNTYsImV4cCI6MjA5NjMyNjI1Nn0.X26WBUuTIb2Gh6lAgIe7UQG6zhgrpdBOhGCDbPV85S4';

const supabaseClient =
window.supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

// ============================
// GLOBAL VARIABLES
// ============================

let Entries = [];

let currentPage = 1;
const EntriesPerPage = 5;

// ============================
// LOGIN
// ============================

window.login = async function(){

    const email =
    document.getElementById(
        "email"
    ).value.trim();

    const password =
    document.getElementById(
        "password"
    ).value;

    if(!email || !password){

        alert(
            "Please enter email and password."
        );

        return;
    }

    const { error } =
    await supabaseClient.auth.signInWithPassword({

        email,
        password

    });

    if(error){

        alert(error.message);
        return;
    }

    document
        .getElementById("loginPage")
        .classList.add("hidden");

    document
        .getElementById("journalPage")
        .classList.remove("hidden");

    await loadEntries();
};

// ============================
// LOGOUT
// ============================

window.logout = async function(){

    await supabaseClient.auth.signOut();

    location.reload();
};

// ============================
// CREATE ENTRY
// ============================

window.addEntry = async function(){

    const title =
    document.getElementById(
        "title"
    ).value.trim();

    const content =
    document.getElementById(
        "entry"
    ).value.trim();

    if(!title || !content){

        alert(
            "Please fill out all fields."
        );

        return;
    }

    const {
        data: { user }
    } =
    await supabaseClient.auth.getUser();

    const { error } =
    await supabaseClient
    .from("Entries")
    .insert({

        user_id: user.id,

        title: title,

        content: content

    });

    if(error){

        console.error(error);

        alert(error.message);

        return;
    }

    document.getElementById(
        "title"
    ).value = "";

    document.getElementById(
        "entry"
    ).value = "";

    currentPage = 1;

    await loadEntries();
};

// ============================
// LOAD Entries
// ============================

async function loadEntries(){

    const {
        data: { user }
    } =
    await supabaseClient.auth.getUser();

    if(!user) return;

    const { data, error } =
    await supabaseClient
    .from("Entries")
    .select("*")
    .eq(
        "user_id",
        user.id
    )
    .order(
        "created_at",
        {
            ascending:false
        }
    );

    if(error){

        console.error(error);

        alert(
            "Failed to load Entries."
        );

        return;
    }

    Entries = data || [];

    renderEntries();
}

// ============================
// DELETE ENTRY
// ============================

window.deleteEntry =
async function(id){

    const confirmDelete =
    confirm(
        "Delete this journal entry?"
    );

    if(!confirmDelete) return;

    const { error } =
    await supabaseClient
    .from("Entries")
    .delete()
    .eq("id", id);

    if(error){

        console.error(error);

        alert(error.message);

        return;
    }

    await loadEntries();
};

// ============================
// RENDER Entries
// ============================

function renderEntries(){

    const container =
    document.getElementById(
        "EntriesContainer"
    );

    container.innerHTML = "";

    const start =
    (currentPage - 1)
    * EntriesPerPage;

    const end =
    start + EntriesPerPage;

    const pageEntries =
    Entries.slice(start,end);

    pageEntries.forEach(
    (entry)=>{

        const post =
        document.createElement(
            "div"
        );

        post.className =
        "post";

        post.innerHTML = `

            <div class="post-title">
                ${entry.title}
            </div>

            <div class="post-date">
                ${new Date(
                    entry.created_at
                ).toLocaleString()}
            </div>

            <div class="post-content">
                ${entry.content}
            </div>

            <button
                class="delete-btn"
                onclick="deleteEntry('${entry.id}')">

                Delete

            </button>

        `;

        container.appendChild(
            post
        );
    });

    const totalPages =
    Math.max(
        1,
        Math.ceil(
            Entries.length /
            EntriesPerPage
        )
    );

    document
    .getElementById(
        "pageNumber"
    )
    .innerText =
    `Page ${currentPage} of ${totalPages}`;
}

// ============================
// PAGINATION
// ============================

window.nextPage =
function(){

    const totalPages =
    Math.ceil(
        Entries.length /
        EntriesPerPage
    );

    if(
        currentPage <
        totalPages
    ){

        currentPage++;

        renderEntries();
    }
};

window.prevPage =
function(){

    if(
        currentPage > 1
    ){

        currentPage--;

        renderEntries();
    }
};