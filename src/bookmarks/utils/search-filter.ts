/**
 * Search and filter logic for bookmarks and folders
 * 
 * Provides:
 * - Global search across all bookmarks
 * - Platform filtering
 * - Combined search + filter
 * - Smart folder expansion for search results
 */

import { Bookmark, FolderTreeNode } from '../storage/types';
import { TreeBuilder } from '../utils/tree-builder';

/**
 * Search filter manager
 */
export class SearchFilter {
    /**
     * Search bookmarks by query
     * 
     * Searches in:
     * - Title
     * - User message
     * - AI response (if present)
     * 
     * @param bookmarks All bookmarks
     * @param query Search query (case-insensitive)
     * @returns Matching bookmarks
     */
    static searchBookmarks(bookmarks: Bookmark[], query: string): Bookmark[] {
        if (!query || query.trim().length === 0) {
            return bookmarks;
        }

        const lowerQuery = query.toLowerCase();

        return bookmarks.filter(b =>
            b.title.toLowerCase().includes(lowerQuery) ||
            b.userMessage.toLowerCase().includes(lowerQuery) ||
            (b.aiResponse && b.aiResponse.toLowerCase().includes(lowerQuery))
        );
    }

    /**
     * Filter bookmarks by platform
     * 
     * @param bookmarks All bookmarks
     * @param platform Platform filter ('ChatGPT', 'Gemini', or 'All')
     * @returns Filtered bookmarks
     */
    static filterByPlatform(
        bookmarks: Bookmark[],
        platform: 'ChatGPT' | 'Gemini' | 'All'
    ): Bookmark[] {
        if (platform === 'All') {
            return bookmarks;
        }

        return bookmarks.filter(b => b.platform === platform);
    }

    /**
     * Apply combined search and filter
     * 
     * @param bookmarks All bookmarks
     * @param query Search query
     * @param platform Platform filter
     * @returns Filtered and searched bookmarks
     */
    static applyFilters(
        bookmarks: Bookmark[],
        query: string,
        platform: 'ChatGPT' | 'Gemini' | 'All'
    ): Bookmark[] {
        let filtered = bookmarks;

        // Apply platform filter first
        filtered = this.filterByPlatform(filtered, platform);

        // Then apply search
        filtered = this.searchBookmarks(filtered, query);

        return filtered;
    }

    /**
     * Filter tree with search and platform filter
     * 
     * Returns new tree with:
     * - Only folders containing matching bookmarks
     * - Auto-expanded paths to matches
     * - Filtered bookmarks in each folder
     * 
     * @param tree Root tree nodes
     * @param query Search query
     * @param platform Platform filter
     * @returns Filtered tree
     */
    static filterTree(
        tree: FolderTreeNode[],
        query: string,
        platform: 'ChatGPT' | 'Gemini' | 'All'
    ): FolderTreeNode[] {
        // Get all bookmarks from tree
        const allBookmarks = TreeBuilder.getAllBookmarks(tree);

        // Apply filters
        const filteredBookmarks = this.applyFilters(allBookmarks, query, platform);

        // If no filters active, return original tree
        if (filteredBookmarks.length === allBookmarks.length) {
            return tree;
        }

        // Build filtered tree
        return this.buildFilteredTree(tree, filteredBookmarks);
    }

    /**
     * Build filtered tree from matching bookmarks
     * 
     * @param tree Original tree
     * @param matchingBookmarks Bookmarks that match filter
     * @returns Filtered tree with auto-expand
     */
    private static buildFilteredTree(
        tree: FolderTreeNode[],
        matchingBookmarks: Bookmark[]
    ): FolderTreeNode[] {
        const matchingPaths = new Set(matchingBookmarks.map(b => b.folderPath));

        return this.filterTreeRecursive(tree, matchingPaths, matchingBookmarks);
    }

    /**
     * Recursively filter tree nodes
     * 
     * @param nodes Tree nodes
     * @param matchingPaths Paths with matching bookmarks
     * @param matchingBookmarks Matching bookmarks
     * @returns Filtered nodes
     */
    private static filterTreeRecursive(
        nodes: FolderTreeNode[],
        matchingPaths: Set<string>,
        matchingBookmarks: Bookmark[]
    ): FolderTreeNode[] {
        const filteredNodes: FolderTreeNode[] = [];

        for (const node of nodes) {
            // Filter bookmarks in this folder
            const nodeBookmarks = matchingBookmarks.filter(
                b => b.folderPath === node.folder.path
            );

            // Recursively filter children
            const filteredChildren = this.filterTreeRecursive(
                node.children,
                matchingPaths,
                matchingBookmarks
            );

            // Include node if it has matching bookmarks or children with matches
            if (nodeBookmarks.length > 0 || filteredChildren.length > 0) {
                filteredNodes.push({
                    ...node,
                    bookmarks: nodeBookmarks,
                    children: filteredChildren,
                    isExpanded: true // Auto-expand when filtering
                });
            }
        }

        return filteredNodes;
    }

    /**
     * Get search statistics
     * 
     * @param allBookmarks All bookmarks
     * @param filteredBookmarks Filtered bookmarks
     * @returns Search statistics
     */
    static getSearchStats(
        allBookmarks: Bookmark[],
        filteredBookmarks: Bookmark[]
    ): {
        total: number;
        matching: number;
        hidden: number;
        percentage: number;
    } {
        const total = allBookmarks.length;
        const matching = filteredBookmarks.length;
        const hidden = total - matching;
        const percentage = total > 0 ? (matching / total) * 100 : 0;

        return { total, matching, hidden, percentage };
    }

    /**
     * Highlight search terms in text
     * 
     * Returns HTML with highlighted terms.
     * 
     * @param text Text to highlight
     * @param query Search query
     * @returns HTML with highlights
     */
    static highlightText(text: string, query: string): string {
        if (!query || query.trim().length === 0) {
            return text;
        }

        // Escape HTML
        const escaped = text.replace(/[&<>"']/g, char => {
            const escapeMap: Record<string, string> = {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;'
            };
            return escapeMap[char];
        });

        // Highlight query (case-insensitive)
        const regex = new RegExp(`(${query})`, 'gi');
        return escaped.replace(regex, '<mark>$1</mark>');
    }
}
