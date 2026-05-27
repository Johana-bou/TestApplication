; installer.nsh — Script NSIS personnalisé pour DouaneGestion
; Supprime toutes les données utilisateur lors de la désinstallation

!macro customUnInstall
  ; ── Demander confirmation à l'utilisateur ──────────────────
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Voulez-vous supprimer toutes les données de DouaneGestion ?$\n$\nCela supprimera la base de données et tous les fichiers de configuration.$\n$\nCette action est irréversible." \
    IDNO skip_data_removal

  ; ── Supprimer les données dans LOCALAPPDATA ─────────────────
  RMDir /r "$LOCALAPPDATA\GestionReceveur"

  ; ── Supprimer les données Electron ──────────────────────────
  RMDir /r "$APPDATA\DouaneGestion"
  RMDir /r "$LOCALAPPDATA\DouaneGestion"

  MessageBox MB_OK|MB_ICONINFORMATION "Toutes les données ont été supprimées avec succès."

  skip_data_removal:
!macroend
