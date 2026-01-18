#!/usr/bin/env python3
"""
Process VotosFotos.csv to keep top 15 photos and rename cards accordingly
"""

import csv
import os
import shutil

def get_last_two_digits(photo_id):
    """Extract last 2 digits from photo ID (e.g., FotosCavet00005 -> 05)"""
    return photo_id[-2:]

def main():
    csv_path = '/Users/juanvi/Desktop/VotosFotos.csv'
    fitxes_dir = 'fitxes'
    
    # Read first 15 lines from CSV
    top_15_photos = []
    with open(csv_path, 'r') as f:
        reader = csv.reader(f)
        for i, row in enumerate(reader):
            if i >= 15:
                break
            if row:
                photo_id = row[0].strip()
                top_15_photos.append(photo_id)
    
    print(f"Top 15 photos from CSV:")
    for i, photo_id in enumerate(top_15_photos, 1):
        print(f"  {i:02d}. {photo_id}")
    
    # Get all HTML files currently in fitxes/
    all_html_files = [f for f in os.listdir(fitxes_dir) if f.endswith('.html')]
    print(f"\nCurrent HTML cards: {len(all_html_files)}")
    
    # Create mapping of old names to new names
    rename_mapping = {}
    for position, photo_id in enumerate(top_15_photos, 1):
        last_digits = get_last_two_digits(photo_id)
        old_filename = f"{photo_id}.html"
        new_filename = f"{position:02d}FC{last_digits}.html"
        rename_mapping[old_filename] = new_filename
    
    # Delete all HTML files that are NOT in the top 15
    files_to_delete = []
    for html_file in all_html_files:
        if html_file not in rename_mapping:
            files_to_delete.append(html_file)
    
    print(f"\nDeleting {len(files_to_delete)} cards not in top 15:")
    for file in files_to_delete:
        filepath = os.path.join(fitxes_dir, file)
        os.remove(filepath)
        print(f"  ✗ Deleted {file}")
    
    # Rename the top 15 HTML files
    print(f"\nRenaming {len(rename_mapping)} cards:")
    for old_name, new_name in rename_mapping.items():
        old_path = os.path.join(fitxes_dir, old_name)
        new_path = os.path.join(fitxes_dir, new_name)
        if os.path.exists(old_path):
            os.rename(old_path, new_path)
            print(f"  → {old_name} → {new_name}")
        else:
            print(f"  ⚠ File not found: {old_name}")
    
    print(f"\n✓ Process complete! {len(rename_mapping)} cards remain in fitxes/")

if __name__ == '__main__':
    main()
