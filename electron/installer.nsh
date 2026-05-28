!macro customUnInstall
  MessageBox MB_YESNO|MB_ICONQUESTION \
    "Voulez-vous supprimer toutes les données de DouaneGestion ?$\n$\nCela supprimera la base de données, les mises à jour et tous les fichiers de configuration.$\n$\nCette action est irréversible." \
    IDNO skip_data_removal

  ; Dossiers utilisateur
  RMDir /r "$LOCALAPPDATA\GestionReceveur"
  RMDir /r "$LOCALAPPDATA\douane-gestion-updater"
  RMDir /r "$APPDATA\DouaneGestion"
  RMDir /r "$LOCALAPPDATA\DouaneGestion"

  ; Dossiers d'installation (au cas où)
  RMDir /r "$PROGRAMFILES\DouaneGestion"
  RMDir /r "$PROGRAMFILES64\DouaneGestion"

  MessageBox MB_OK|MB_ICONINFORMATION "Toutes les données ont été supprimées avec succès."

  skip_data_removal:
!macroend
